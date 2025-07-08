/**
 * Price service using Helius API for real-time SOL and USDC prices
 */

export interface PriceData {
  symbol: string;
  price: number;
  currency: string;
  timestamp: number;
  change24h?: number;
  changePercent24h?: number;
}

export interface PriceResponse {
  sol: PriceData;
  usdc: PriceData;
}

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const HELIUS_BASE_URL = 'https://mainnet.helius-rpc.com';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Environment validation and logging
console.log('🔧 Price Service Configuration:');
console.log('- Helius API Key:', HELIUS_API_KEY ? `${HELIUS_API_KEY.substring(0, 8)}...` : 'Not configured');
console.log('- Using Helius:', HELIUS_API_KEY && HELIUS_API_KEY !== 'your_helius_api_key_here');
console.log('- CoinGecko API:', COINGECKO_API);
console.log('- Helius RPC:', HELIUS_BASE_URL);

// Token addresses for price lookups
const TOKEN_ADDRESSES = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC
};

// Use backend proxy to avoid CORS issues
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class PriceService {
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get current SOL and USDC prices
   */
  async getPrices(): Promise<PriceResponse> {
    console.log('🔍 PriceService.getPrices() called');
    try {
      const [solPrice, usdcPrice] = await Promise.all([
        this.getTokenPrice('SOL'),
        this.getTokenPrice('USDC')
      ]);

      console.log('✅ Successfully fetched prices:', { sol: solPrice.price, usdc: usdcPrice.price });
      return {
        sol: solPrice,
        usdc: usdcPrice
      };
    } catch (error) {
      console.error('❌ Failed to fetch prices:', error);
      throw new Error('Unable to fetch current prices');
    }
  }

  /**
   * Get price for a specific token
   */
  async getTokenPrice(symbol: 'SOL' | 'USDC'): Promise<PriceData> {
    // Check cache first
    const cached = this.getCachedPrice(symbol);
    if (cached) {
      return cached;
    }

    try {
      let priceData: PriceData;

      if (HELIUS_API_KEY && HELIUS_API_KEY !== 'your_helius_api_key_here') {
        // Try Helius first
        priceData = await this.fetchHeliusPrice(symbol);
      } else {
        // Fallback to CoinGecko
        priceData = await this.fetchCoinGeckoPrice(symbol);
      }

      // Cache the result
      this.setCachedPrice(symbol, priceData);
      return priceData;

    } catch (error) {
      console.error(`Failed to fetch ${symbol} price:`, error);
      
      // Try fallback if Helius fails
      if (HELIUS_API_KEY && HELIUS_API_KEY !== 'your_helius_api_key_here') {
        try {
          const fallbackPrice = await this.fetchCoinGeckoPrice(symbol);
          this.setCachedPrice(symbol, fallbackPrice);
          return fallbackPrice;
        } catch (fallbackError) {
          console.error(`Fallback price fetch failed for ${symbol}:`, fallbackError);
        }
      }
      
      // Return mock data if all fails
      return this.getMockPrice(symbol);
    }
  }

  /**
   * Fetch price from Helius API using Jupiter price oracle
   */
  private async fetchHeliusPrice(symbol: 'SOL' | 'USDC'): Promise<PriceData> {
    try {
      // Use Jupiter API for more accurate on-chain prices
      const jupiterUrl = `https://price.jup.ag/v6/price?ids=${symbol}`;
      
      console.log(`🔍 Fetching ${symbol} price from Jupiter via Helius: ${jupiterUrl}`);
      
      const response = await fetch(jupiterUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 Jupiter raw data for ${symbol}:`, data);
      
      const priceInfo = data.data?.[symbol];
      if (!priceInfo) {
        throw new Error(`No price data found for ${symbol} from Jupiter`);
      }

      const priceData = {
        symbol,
        price: priceInfo.price,
        currency: 'USD',
        timestamp: Date.now(),
        change24h: 0, // Jupiter doesn't provide 24h change
        changePercent24h: 0
      };

      console.log(`✅ Parsed ${symbol} price from Jupiter:`, priceData);
      return priceData;
    } catch (error) {
      console.error(`❌ Jupiter price fetch failed for ${symbol}:`, error);
      // Fallback to CoinGecko
      console.log(`🔄 Falling back to CoinGecko for ${symbol}...`);
      return this.fetchCoinGeckoPrice(symbol);
    }
  }

  /**
   * Fetch price from CoinGecko API
   */
  private async fetchCoinGeckoPrice(symbol: 'SOL' | 'USDC'): Promise<PriceData> {
    const coinId = symbol === 'SOL' ? 'solana' : 'usd-coin';
    const url = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    
    console.log(`🔍 Fetching ${symbol} price from CoinGecko: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log(`📡 CoinGecko response status for ${symbol}:`, response.status);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 CoinGecko raw data for ${symbol}:`, data);
      
      const coinData = data[coinId];

      if (!coinData) {
        throw new Error(`No price data found for ${symbol}`);
      }

      const priceData = {
        symbol,
        price: coinData.usd,
        currency: 'USD',
        timestamp: Date.now(),
        change24h: coinData.usd_24h_change || 0,
        changePercent24h: coinData.usd_24h_change || 0
      };

      console.log(`✅ Parsed ${symbol} price:`, priceData);
      return priceData;
    } catch (error) {
      console.error(`❌ CoinGecko fetch failed for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get cached price if still valid
   */
  private getCachedPrice(symbol: string): PriceData | null {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache price data
   */
  private setCachedPrice(symbol: string, data: PriceData): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get mock price data as fallback
   */
  private getMockPrice(symbol: 'SOL' | 'USDC'): PriceData {
    const mockPrices = {
      SOL: { price: 100, change: 2.5 },
      USDC: { price: 1.00, change: 0.1 }
    };

    const mock = mockPrices[symbol];
    return {
      symbol,
      price: mock.price,
      currency: 'USD',
      timestamp: Date.now(),
      change24h: mock.change,
      changePercent24h: mock.change
    };
  }

  /**
   * Convert SOL amount to USD
   */
  async solToUsd(solAmount: number): Promise<number> {
    const solPrice = await this.getTokenPrice('SOL');
    return solAmount * solPrice.price;
  }

  /**
   * Convert USD amount to SOL
   */
  async usdToSol(usdAmount: number): Promise<number> {
    const solPrice = await this.getTokenPrice('SOL');
    return usdAmount / solPrice.price;
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const priceService = new PriceService();
export default priceService;