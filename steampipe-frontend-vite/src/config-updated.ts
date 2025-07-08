export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

// Solana configuration
export const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Program configuration
export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';

// USDC mint address (devnet)
export const USDC_MINT = import.meta.env.VITE_USDC_MINT || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';

// Steam configuration
export const STEAM_API_URL = 'https://api.steampowered.com';
export const STEAM_COMMUNITY_URL = 'https://steamcommunity.com';

// Trading configuration
export const TRADE_TIMEOUT_HOURS = 1;
export const MIN_TRADE_AMOUNT = 1000000; // 1 USDC in microlamports
export const MAX_TRADE_AMOUNT = 1000000000000; // 1M USDC in microlamports
