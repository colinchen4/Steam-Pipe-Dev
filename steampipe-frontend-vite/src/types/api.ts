// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Steam-related types
export interface SteamItem {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
  pos: number;
  id: string;
  name: string;
  market_name: string;
  market_hash_name: string;
  icon_url: string;
  tradable: boolean;
  marketable: boolean;
  // Additional properties for the DEX UI
  price?: string;
  float_value?: string;
  wear_name?: string;
  owner?: string;
}

export interface SteamInventoryResponse extends ApiResponse<SteamItem[]> {
  items?: SteamItem[];
}

export interface SteamAccount {
  steamId: string;
  displayName: string;
  avatar: string;
  isConnected: boolean;
}

// Trade-related types
export interface TradeStatus {
  tradeId: string;
  state: string;
  buyer: string;
  seller: string;
  amount: number;
  steamItemId: string;
  createdAt: string;
  expiresAt: string;
  steamTradeUrl?: string;
}

export interface TradeResponse extends ApiResponse<TradeStatus> {
  tradeId?: string;
  transactionHash?: string;
}

export interface TradeInitiateRequest {
  tradeId: number;
  escrowAccount: string;
  sellerSteamId: string;
  buyerSteamId: string;
  buyerTradeToken?: string;
  itemId: string;
  itemAssetId: string;
  amount: number;
}

export interface TradeVerifyRequest {
  tradeId: string;
  escrowAccount: string;
  sellerSteamId: string;
  itemId: string;
}

export interface TradeCompleteRequest {
  tradeId: string;
  escrowAccount: string;
  steamTradeUrl?: string;
}

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
