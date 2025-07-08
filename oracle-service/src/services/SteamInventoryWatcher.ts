import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';
import { OracleService } from './OracleService';
import * as cron from 'node-cron';

interface WatchTarget {
  escrowId: string;
  buyerSteamId: string;
  assetId: string;
  startTime: number;
  deadline: number;
}

interface InventoryItem {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
  pos: number;
}

interface SteamInventoryResponse {
  assets?: InventoryItem[];
  descriptions?: any[];
  success: boolean;
  error?: string;
}

export class SteamInventoryWatcher {
  private watchTargets: Map<string, WatchTarget> = new Map();
  private inventoryCache: Map<string, InventoryItem[]> = new Map();
  private oracleService: OracleService;
  private isMonitoring: boolean = false;
  private apiCallCount: number = 0;
  private lastApiReset: number = Date.now();
  private readonly MAX_API_CALLS_PER_DAY = 100000;

  constructor() {
    this.oracleService = new OracleService();
  }

  async initialize() {
    logger.info('Initializing Steam Inventory Watcher...');
    
    // Start periodic monitoring
    cron.schedule('*/2 * * * * *', async () => {
      if (this.isMonitoring) {
        await this.checkAllTargets();
      }
    });

    // Reset API call counter daily
    cron.schedule('0 0 * * *', () => {
      this.apiCallCount = 0;
      this.lastApiReset = Date.now();
      logger.info('Daily API call counter reset');
    });

    logger.info('Steam Inventory Watcher initialized');
  }

  async startMonitoring() {
    this.isMonitoring = true;
    logger.info('Steam inventory monitoring started');
  }

  async stop() {
    this.isMonitoring = false;
    this.watchTargets.clear();
    this.inventoryCache.clear();
    logger.info('Steam inventory monitoring stopped');
  }

  addWatchTarget(escrowId: string, buyerSteamId: string, assetId: string, deadline: number) {
    const target: WatchTarget = {
      escrowId,
      buyerSteamId,
      assetId,
      startTime: Date.now(),
      deadline: deadline * 1000, // Convert to milliseconds
    };

    this.watchTargets.set(escrowId, target);
    logger.info(`Added watch target: ${escrowId} for asset ${assetId} to buyer ${buyerSteamId}`);
  }

  removeWatchTarget(escrowId: string) {
    this.watchTargets.delete(escrowId);
    logger.info(`Removed watch target: ${escrowId}`);
  }

  getActiveWatches(): number {
    return this.watchTargets.size;
  }

  getApiStatus() {
    const remainingCalls = this.MAX_API_CALLS_PER_DAY - this.apiCallCount;
    const utilizationPercent = (this.apiCallCount / this.MAX_API_CALLS_PER_DAY) * 100;
    
    return {
      calls_made_today: this.apiCallCount,
      remaining_calls: remainingCalls,
      utilization_percent: utilizationPercent.toFixed(2),
      last_reset: new Date(this.lastApiReset).toISOString(),
      status: utilizationPercent > 90 ? 'critical' : utilizationPercent > 70 ? 'warning' : 'healthy'
    };
  }

  async checkAllTargets() {
    const now = Date.now();
    const expiredTargets: string[] = [];

    for (const [escrowId, target] of this.watchTargets) {
      try {
        // Check if deadline passed
        if (now > target.deadline) {
          expiredTargets.push(escrowId);
          continue;
        }

        // Check inventory for the asset
        const hasAsset = await this.checkBuyerInventory(target.buyerSteamId, target.assetId);
        
        if (hasAsset) {
          // Asset found in buyer's inventory - generate receipt
          await this.generateReceipt(target);
          expiredTargets.push(escrowId); // Remove from watch list
        }
      } catch (error) {
        logger.error(`Error checking target ${escrowId}:`, error);
      }
    }

    // Clean up expired targets
    expiredTargets.forEach(escrowId => {
      this.removeWatchTarget(escrowId);
    });
  }

  async checkBuyerInventory(steamId: string, assetId: string): Promise<boolean> {
    try {
      // Rate limiting check
      if (this.apiCallCount >= this.MAX_API_CALLS_PER_DAY) {
        logger.warn('Daily API limit reached, using cached data');
        return this.checkCachedInventory(steamId, assetId);
      }

      const inventory = await this.fetchSteamInventory(steamId);
      this.apiCallCount++;

      if (!inventory) {
        return false;
      }

      // Cache the inventory
      this.inventoryCache.set(steamId, inventory);

      // Check if asset exists in inventory
      return inventory.some(item => item.assetid === assetId);
    } catch (error) {
      logger.error(`Failed to check inventory for ${steamId}:`, error);
      return false;
    }
  }

  private checkCachedInventory(steamId: string, assetId: string): boolean {
    const cachedInventory = this.inventoryCache.get(steamId);
    if (!cachedInventory) {
      return false;
    }

    return cachedInventory.some(item => item.assetid === assetId);
  }

  private async fetchSteamInventory(steamId: string): Promise<InventoryItem[] | null> {
    try {
      const url = `https://steamcommunity.com/inventory/${steamId}/730/2`;
      const response = await axios.get<SteamInventoryResponse>(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'SteamPipe-Oracle/1.0'
        }
      });

      if (!response.data.success) {
        logger.warn(`Steam API returned error for ${steamId}: ${response.data.error}`);
        return null;
      }

      return response.data.assets || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          logger.warn('Steam API rate limit hit');
          throw new Error('Rate limited');
        }
        if (error.response?.status === 403) {
          logger.warn(`Private inventory: ${steamId}`);
          return null;
        }
      }
      
      logger.error(`Steam API request failed for ${steamId}:`, error);
      throw error;
    }
  }

  async verifyInventoryChange(buyerSteamId: string, assetId: string, escrowId: string) {
    try {
      const hasAsset = await this.checkBuyerInventory(buyerSteamId, assetId);
      
      if (hasAsset) {
        const signature = await this.oracleService.signDeliveryReceipt(
          assetId,
          buyerSteamId,
          escrowId
        );

        return {
          success: true,
          signature,
          timestamp: Date.now(),
          oracle_id: config.ORACLE_ID
        };
      }

      return {
        success: false,
        signature: null,
        timestamp: Date.now(),
        oracle_id: config.ORACLE_ID
      };
    } catch (error) {
      logger.error(`Verification failed for ${escrowId}:`, error);
      throw error;
    }
  }

  private async generateReceipt(target: WatchTarget) {
    try {
      const signature = await this.oracleService.signDeliveryReceipt(
        target.assetId,
        target.buyerSteamId,
        target.escrowId
      );

      await this.oracleService.storeReceipt(target.escrowId, {
        assetId: target.assetId,
        buyerSteamId: target.buyerSteamId,
        signature,
        timestamp: Date.now(),
        oracle_id: config.ORACLE_ID
      });

      logger.info(`Generated receipt for escrow ${target.escrowId}`);
    } catch (error) {
      logger.error(`Failed to generate receipt for ${target.escrowId}:`, error);
    }
  }
}