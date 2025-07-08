import { useReducer, useCallback } from 'react';
import { SteamItem, TradeStatus } from '../types/api';

// Trading state interface
export interface TradingState {
  steamId: string;
  inventory: SteamItem[];
  selectedItem: SteamItem | null;
  price: string;
  loading: boolean;
  error: string | null;
  success: string | null;
  trades: TradeStatus[];
  activeStep: number;
  tradeDialogOpen: boolean;
  backendStatus: 'unknown' | 'online' | 'offline';
  steamConnected: boolean;
}

// Action types
export type TradingAction =
  | { type: 'SET_STEAM_ID'; payload: string }
  | { type: 'SET_INVENTORY'; payload: SteamItem[] }
  | { type: 'SET_SELECTED_ITEM'; payload: SteamItem | null }
  | { type: 'SET_PRICE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_TRADES'; payload: TradeStatus[] }
  | { type: 'SET_ACTIVE_STEP'; payload: number }
  | { type: 'SET_TRADE_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_BACKEND_STATUS'; payload: 'unknown' | 'online' | 'offline' }
  | { type: 'SET_STEAM_CONNECTED'; payload: boolean }
  | { type: 'RESET_MESSAGES' }
  | { type: 'RESET_FORM' };

// Initial state
const initialState: TradingState = {
  steamId: '',
  inventory: [],
  selectedItem: null,
  price: '',
  loading: false,
  error: null,
  success: null,
  trades: [],
  activeStep: 0,
  tradeDialogOpen: false,
  backendStatus: 'unknown',
  steamConnected: false,
};

// Reducer function
function tradingReducer(state: TradingState, action: TradingAction): TradingState {
  switch (action.type) {
    case 'SET_STEAM_ID':
      return { ...state, steamId: action.payload };
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
    case 'SET_SELECTED_ITEM':
      return { ...state, selectedItem: action.payload };
    case 'SET_PRICE':
      return { ...state, price: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, loading: false };
    case 'SET_TRADES':
      return { ...state, trades: action.payload };
    case 'SET_ACTIVE_STEP':
      return { ...state, activeStep: action.payload };
    case 'SET_TRADE_DIALOG_OPEN':
      return { ...state, tradeDialogOpen: action.payload };
    case 'SET_BACKEND_STATUS':
      return { ...state, backendStatus: action.payload };
    case 'SET_STEAM_CONNECTED':
      return { ...state, steamConnected: action.payload };
    case 'RESET_MESSAGES':
      return { ...state, error: null, success: null };
    case 'RESET_FORM':
      return {
        ...state,
        selectedItem: null,
        price: '',
        error: null,
        success: null,
        activeStep: 0,
      };
    default:
      return state;
  }
}

// Custom hook for trading state management
export function useTradingState() {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // Action creators
  const actions = {
    setSteamId: useCallback((steamId: string) => {
      dispatch({ type: 'SET_STEAM_ID', payload: steamId });
    }, []),

    setInventory: useCallback((inventory: SteamItem[]) => {
      dispatch({ type: 'SET_INVENTORY', payload: inventory });
    }, []),

    setSelectedItem: useCallback((item: SteamItem | null) => {
      dispatch({ type: 'SET_SELECTED_ITEM', payload: item });
    }, []),

    setPrice: useCallback((price: string) => {
      dispatch({ type: 'SET_PRICE', payload: price });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    setSuccess: useCallback((success: string | null) => {
      dispatch({ type: 'SET_SUCCESS', payload: success });
    }, []),

    setTrades: useCallback((trades: TradeStatus[]) => {
      dispatch({ type: 'SET_TRADES', payload: trades });
    }, []),

    setActiveStep: useCallback((step: number) => {
      dispatch({ type: 'SET_ACTIVE_STEP', payload: step });
    }, []),

    setTradeDialogOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_TRADE_DIALOG_OPEN', payload: open });
    }, []),

    setBackendStatus: useCallback((status: 'unknown' | 'online' | 'offline') => {
      dispatch({ type: 'SET_BACKEND_STATUS', payload: status });
    }, []),

    setSteamConnected: useCallback((connected: boolean) => {
      dispatch({ type: 'SET_STEAM_CONNECTED', payload: connected });
    }, []),

    resetMessages: useCallback(() => {
      dispatch({ type: 'RESET_MESSAGES' });
    }, []),

    resetForm: useCallback(() => {
      dispatch({ type: 'RESET_FORM' });
    }, []),
  };

  return { state, actions };
}
