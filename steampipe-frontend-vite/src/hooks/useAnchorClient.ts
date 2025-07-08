import { useEffect, useState } from 'react';
import { AnchorProvider } from '@project-serum/anchor';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '../contexts/WalletContext';
import { AnchorClient } from '../services/anchorClient';

declare global {
  interface Window {
    solana?: any; // Using any to avoid complex type definitions for now
  }
}

export const useAnchorClient = () => {
  const { connected } = useWallet();
  const [client, setClient] = useState<AnchorClient | null>(null);

  useEffect(() => {
    if (connected && window.solana) {
      try {
        // Use devnet connection
        const connection = new Connection(clusterApiUrl('devnet'), {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });
        
        const provider = new AnchorProvider(
          connection,
          window.solana,
          { 
            commitment: 'confirmed',
            preflightCommitment: 'confirmed'
          }
        );
        
        const anchorClient = new AnchorClient(provider);
        setClient(anchorClient);
      } catch (error) {
        console.error('Error initializing Anchor client:', error);
      }
    } else {
      setClient(null);
    }
  }, [connected]);

  return client;
};
