import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { priceService, PriceData, PriceResponse } from '../services/priceService';

interface PriceContextType {
  prices: PriceResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refreshPrices: () => Promise<void>;
  solPrice: number;
  usdcPrice: number;
  solToUsd: (solAmount: number) => number;
  usdToSol: (usdAmount: number) => number;
}

const PriceContext = createContext<PriceContextType>({
  prices: null,
  loading: false,
  error: null,
  lastUpdated: null,
  refreshPrices: async () => {},
  solPrice: 0,
  usdcPrice: 0,
  solToUsd: () => 0,
  usdToSol: () => 0,
});

export const usePrice = () => useContext(PriceContext);

export const PriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const refreshPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching latest SOL and USDC prices...');
      const priceData = await priceService.getPrices();
      setPrices(priceData);
      setLastUpdated(Date.now());
      console.log('✅ Prices updated:', {
        SOL: `$${priceData.sol.price.toFixed(2)}`,
        USDC: `$${priceData.usdc.price.toFixed(4)}`
      });
    } catch (err: any) {
      console.error('❌ Failed to fetch prices:', err);
      setError(err.message || 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh prices on mount and every 30 seconds
  useEffect(() => {
    refreshPrices();
    
    const interval = setInterval(refreshPrices, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshPrices]);

  // Helper functions
  const solToUsd = useCallback((solAmount: number): number => {
    if (!prices) return 0;
    return solAmount * prices.sol.price;
  }, [prices]);

  const usdToSol = useCallback((usdAmount: number): number => {
    if (!prices) return 0;
    return usdAmount / prices.sol.price;
  }, [prices]);

  const value: PriceContextType = {
    prices,
    loading,
    error,
    lastUpdated,
    refreshPrices,
    solPrice: prices?.sol.price || 0,
    usdcPrice: prices?.usdc.price || 0,
    solToUsd,
    usdToSol,
  };

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
};