import { PublicKey } from '@solana/web3.js';

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: PublicKey | null;
  isConnected: boolean;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  request: (params: any) => Promise<any>;
  on: (event: string, callback: (args: any) => void) => void;
  off: (event: string, callback: (args: any) => void) => void;
}

interface Window {
  solana?: PhantomProvider;
}
