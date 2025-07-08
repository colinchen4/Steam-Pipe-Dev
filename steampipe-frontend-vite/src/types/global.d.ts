import { Solana } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isConnected?: boolean;
      publicKey?: {
        toBase58(): string;
      };
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      on: (event: string, handler: (args: any) => void) => void;
      request: (args: any) => Promise<any>;
    };
  }
}
