import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { SteamInventoryWatcher } from './services/SteamInventoryWatcher';
import { OracleService } from './services/OracleService';
import { MetricsService } from './services/MetricsService';
import { logger } from './utils/logger';
import { config } from './config';

dotenv.config();

class OracleServer {
  private app: express.Application;
  private server: any;
  private steamWatcher: SteamInventoryWatcher;
  private oracleService: OracleService;
  private metricsService: MetricsService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    
    this.steamWatcher = new SteamInventoryWatcher();
    this.oracleService = new OracleService();
    this.metricsService = new MetricsService();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        oracle_id: config.ORACLE_ID,
        region: config.REGION,
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.metricsService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
      }
    });

    // Get oracle receipt for escrow settlement
    this.app.get('/receipt/:escrowId', async (req, res) => {
      try {
        const { escrowId } = req.params;
        const receipt = await this.oracleService.getReceipt(escrowId);
        
        if (!receipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }

        res.json(receipt);
      } catch (error) {
        logger.error('Failed to get receipt:', error);
        res.status(500).json({ error: 'Failed to get receipt' });
      }
    });

    // Manual verification endpoint (for debugging)
    this.app.post('/verify', async (req, res) => {
      try {
        const { buyerSteamId, assetId, escrowId } = req.body;
        
        const result = await this.steamWatcher.verifyInventoryChange(
          buyerSteamId,
          assetId,
          escrowId
        );

        res.json({
          verified: result.success,
          signature: result.signature,
          timestamp: result.timestamp,
          oracle_id: config.ORACLE_ID
        });
      } catch (error) {
        logger.error('Manual verification failed:', error);
        res.status(500).json({ error: 'Verification failed' });
      }
    });

    // Oracle status
    this.app.get('/status', (req, res) => {
      res.json({
        oracle_id: config.ORACLE_ID,
        region: config.REGION,
        public_key: config.ORACLE_PUBLIC_KEY,
        steam_api_status: this.steamWatcher.getApiStatus(),
        active_watches: this.steamWatcher.getActiveWatches(),
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
      });
    });
  }

  public async start() {
    try {
      // Initialize services
      await this.steamWatcher.initialize();
      await this.oracleService.initialize();
      await this.metricsService.initialize();

      // Start HTTP server
      this.server = createServer(this.app);
      const port = config.PORT || 3000;
      
      this.server.listen(port, () => {
        logger.info(`Oracle service started on port ${port}`);
        logger.info(`Oracle ID: ${config.ORACLE_ID}`);
        logger.info(`Region: ${config.REGION}`);
        logger.info(`Public Key: ${config.ORACLE_PUBLIC_KEY}`);
      });

      // Start Steam inventory monitoring
      await this.steamWatcher.startMonitoring();
      
      logger.info('Oracle service fully initialized');
    } catch (error) {
      logger.error('Failed to start oracle service:', error);
      process.exit(1);
    }
  }

  public async stop() {
    logger.info('Shutting down oracle service...');
    
    if (this.server) {
      this.server.close();
    }
    
    await this.steamWatcher.stop();
    await this.oracleService.stop();
    await this.metricsService.stop();
    
    logger.info('Oracle service shut down complete');
  }
}

// Handle graceful shutdown
const oracleServer = new OracleServer();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await oracleServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await oracleServer.stop();
  process.exit(0);
});

// Start the server
oracleServer.start().catch((error) => {
  logger.error('Fatal error starting oracle service:', error);
  process.exit(1);
});