import axios from 'axios';
import { BACKEND_URL } from '../config';

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token on authentication error
      localStorage.removeItem('token');
    } else if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

// Steam API methods
export const steamApi = {
  getAccount: async (walletAddress: string) => {
    try {
      const response = await api.get(`/api/steam/account/${walletAddress}`);
      return response.data.success ? {
        steamId: response.data.steamId,
        displayName: response.data.displayName,
        avatar: response.data.avatar,
        isConnected: true
      } : null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return null for not found, which is an expected case
        return null;
      }
      throw error;
    }
  },

  unbind: async () => {
    const response = await api.post('/api/steam/unbind');
    return response.data;
  }
};

// Auth API methods
export const authApi = {
  connectSteam: (walletAddress: string) => {
    // Redirect to Steam OpenID login
    const realm = BACKEND_URL;
    const returnUrl = `${BACKEND_URL}/api/auth/steam/return?wallet=${encodeURIComponent(walletAddress)}`;
    
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnUrl,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });

    const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;
    window.location.href = steamLoginUrl;
  },

  checkStatus: async () => {
    const response = await api.get('/api/auth/status');
    return response.data;
  }
};

// Order API methods
export const orderApi = {
  createOrder: async (orderData: any) => {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  },
  getOrder: async (orderId: string) => {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  },
  getUserOrders: async (userId: string) => {
    const response = await api.get(`/api/orders/user/${userId}`);
    return response.data;
  },
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/api/orders/${orderId}/status`, { status });
    return response.data;
  }
};

// Market API methods
export const marketApi = {
  // Get price from a specific platform
  getPrice: async (platform: string, itemName: string) => {
    try {
      const response = await api.get(`/api/market/price/${platform}/${encodeURIComponent(itemName)}`);
      return response.data.success ? response.data.price : null;
    } catch (error: any) {
      console.error('Failed to fetch price:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get prices from all platforms
  getAllPrices: async (itemName: string) => {
    try {
      const response = await api.get(`/api/market/prices/${encodeURIComponent(itemName)}`);
      return response.data.success ? response.data.prices : null;
    } catch (error: any) {
      console.error('Failed to fetch all prices:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get orders from a specific platform
  getOrders: async (platform: string, itemName: string) => {
    try {
      const response = await api.get(`/api/market/orders/${platform}/${encodeURIComponent(itemName)}`);
      return response.data.success ? response.data.orders : null;
    } catch (error: any) {
      console.error('Failed to fetch orders:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get batch prices from a specific platform
  getBatchPrices: async (platform: string, items: string[]) => {
    try {
      const response = await api.post(`/api/market/batch-prices/${platform}`, { items });
      return response.data.success ? response.data.prices : null;
    } catch (error: any) {
      console.error('Failed to fetch batch prices:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get detailed market data from a specific platform
  getMarketData: async (platform: string, itemName: string) => {
    try {
      const response = await api.get(`/api/market/data/${platform}/${encodeURIComponent(itemName)}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      console.error('Failed to fetch market data:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get detailed market data from all platforms
  getAllMarketData: async (itemName: string) => {
    try {
      const response = await api.get(`/api/market/data-all/${encodeURIComponent(itemName)}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      console.error('Failed to fetch all market data:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default api;
