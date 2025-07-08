import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { 
  BACKEND_URL, 
  API_TIMEOUT, 
  RETRY_ATTEMPTS 
} from '../config';
import { 
  ApiResponse, 
  SteamItem, 
  SteamInventoryResponse, 
  TradeStatus, 
  TradeResponse,
  TradeInitiateRequest,
  TradeVerifyRequest,
  TradeCompleteRequest,
  ApiError
} from '../types/api';
import { withRetry, checkRateLimit } from '../utils/apiUtils';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (error.response) {
      // Handle authentication errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Redirect to login page if needed
        window.dispatchEvent(new CustomEvent('auth:logout'));
      } else if (error.response.status === 403) {
        console.error('Access forbidden:', error.response.data);
      } else if (error.response.status === 429 && !originalRequest._retry) {
        // Rate limiting - wait and retry once
        originalRequest._retry = true;
        await new Promise(resolve => setTimeout(resolve, 2000));
        return api(originalRequest);
      }
      
      // Create a more informative error
      const apiError = new ApiError(
        (error as any)?.response?.data?.message || 'API request failed',
        (error as any)?.response?.status,
        (error as any)?.response?.data?.code
      );
      return Promise.reject(apiError);
    }
    
    // Network errors
    if (error.request) {
      const apiError = new ApiError(
        'Network error - no response received',
        0,
        'NETWORK_ERROR'
      );
      return Promise.reject(apiError);
    }
    
    return Promise.reject(error);
  }
);

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse> => {
    try {
      const response = await withRetry(() => api.get<ApiResponse>('/health'));
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

// Steam API methods
export const steamApi = {
  // Verify Steam item ownership
  verifyItem: async (steamId: string, itemId: string): Promise<ApiResponse> => {
    if (!checkRateLimit(`verify-${steamId}`, 5, 60000)) {
      throw new ApiError('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT');
    }
    
    try {
      const response = await withRetry(() => 
        api.post<ApiResponse>('/api/verify-item', { steamId, itemId })
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying item:', error);
      throw error;
    }
  },

  // Get Steam inventory
  getInventory: async (steamId: string): Promise<SteamInventoryResponse> => {
    try {
      const response = await withRetry(() => 
        api.get<SteamInventoryResponse>(`/api/steam/inventory/${steamId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get Steam account by wallet address
  getAccount: async (walletAddress: string): Promise<ApiResponse> => {
    try {
      const response = await withRetry(() => 
        api.get<ApiResponse>(`/api/steam/account/${walletAddress}`)
      );
      
      if (response.data.success) {
        return {
          success: true,
          data: {
            steamId: response.data.data?.steamId,
            displayName: response.data.data?.displayName,
            avatar: response.data.data?.avatar,
            isConnected: true
          }
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error getting Steam account:', error);
      return { success: false };
    }
  },

  // Unbind Steam account
  unbind: async (walletAddress: string): Promise<ApiResponse> => {
    try {
      const response = await withRetry(() => 
        api.post<ApiResponse>('/api/steam/unbind', { walletAddress })
      );
      return response.data;
    } catch (error) {
      console.error('Error unbinding Steam account:', error);
      throw error;
    }
  }
};

// Trading API methods
export const tradingApi = {
  // Initiate a trade
  initiateTrade: async (tradeData: TradeInitiateRequest): Promise<TradeResponse> => {
    try {
      const response = await withRetry(() => 
        api.post<TradeResponse>('/api/initiate-trade', tradeData)
      );
      return response.data;
    } catch (error) {
      console.error('Error initiating trade:', error);
      throw error;
    }
  },

  // Get trade status
  getTradeStatus: async (tradeId: string): Promise<TradeResponse> => {
    try {
      const response = await withRetry(() => 
        api.get<TradeResponse>(`/api/trade/${tradeId}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error getting trade status:', error);
      throw error;
    }
  },

  // Get all trades (admin)
  getAllTrades: async (): Promise<ApiResponse<TradeStatus[]>> => {
    try {
      const response = await withRetry(() => 
        api.get<ApiResponse<TradeStatus[]>>('/api/admin/trades')
      );
      return response.data;
    } catch (error) {
      console.error('Error getting all trades:', error);
      throw error;
    }
  },
  
  // Get user trades
  getUserTrades: async (walletAddress: string): Promise<ApiResponse<TradeStatus[]>> => {
    try {
      const response = await withRetry(() => 
        api.get<ApiResponse<TradeStatus[]>>(`/api/trades/user/${walletAddress}`)
      );
      return response.data;
    } catch (error) {
      console.error('Error getting user trades:', error);
      throw error;
    }
  }
};

// Admin API methods
export const adminApi = {
  // Manual trade verification
  verifyTrade: async (tradeData: TradeVerifyRequest): Promise<TradeResponse> => {
    try {
      const response = await withRetry(() => 
        api.post<TradeResponse>('/api/admin/verify-trade', tradeData)
      );
      return response.data;
    } catch (error) {
      console.error('Error in manual verification:', error);
      throw error;
    }
  },

  // Manual trade completion
  completeTrade: async (tradeData: TradeCompleteRequest): Promise<TradeResponse> => {
    try {
      const response = await withRetry(() => 
        api.post<TradeResponse>('/api/admin/complete-trade', tradeData)
      );
      return response.data;
    } catch (error) {
      console.error('Error in manual completion:', error);
      throw error;
    }
  }
};

export default api;
