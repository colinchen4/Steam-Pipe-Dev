// Backend Configuration
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Solana Configuration
export const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Program Configuration
export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

// USDC mint address (devnet)
export const USDC_MINT = import.meta.env.VITE_USDC_MINT || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

// Steam Configuration
export const STEAM_API_URL = 'https://api.steampowered.com';
export const STEAM_COMMUNITY_URL = 'https://steamcommunity.com';

// Trading Configuration
export const TRADE_TIMEOUT_HOURS = 1;
export const MIN_TRADE_AMOUNT = 1000000; // 1 USDC in micro-units
export const MAX_TRADE_AMOUNT = 1000000000000; // 1M USDC in micro-units

// API Configuration
export const API_TIMEOUT = 10000; // 10 seconds
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// Environment-specific configuration
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
