import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { useTestMode } from './TestModeContext';
import { useNetwork } from './NetworkContext';

interface PhantomWindow extends Window {
  solana?: {
    connect: () => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    isPhantom?: boolean;
    on: (event: string, callback: (args: any) => void) => void;
    off: (event: string, callback: (args: any) => void) => void;
    publicKey: PublicKey | null;
    request: (params: { method: string; params: any }) => Promise<any>;
  };
}

declare const window: PhantomWindow;

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  balance: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isPhantomInstalled: boolean;
  refreshBalance: () => Promise<void>;
  isLoadingBalance: boolean;
  balanceLastUpdated: number | null;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  balance: 0,
  connect: async () => {},
  disconnect: async () => {},
  isPhantomInstalled: false,
  refreshBalance: async () => {},
  isLoadingBalance: false,
  balanceLastUpdated: null,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { testMode, testPublicKey } = useTestMode();
  const { connection, network } = useNetwork();
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState(0);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceLastUpdated, setBalanceLastUpdated] = useState<number | null>(null);

  const switchToDevnet = async () => {
    try {
      if (!window.solana) {
        throw new Error('Phantom wallet not installed');
      }

      // We'll skip network switching for now as it's causing issues
      console.log('Using devnet connection');
      return;
    } catch (error) {
      console.warn('Network switching not supported:', error);
      // Don't throw error, just continue with connection
    }
  };

  const updateBalance = async (pubKey: PublicKey) => {
    setIsLoadingBalance(true);
    try {
      console.log(`Fetching balance for ${pubKey.toString()} on ${network}...`);
      const balance = await connection.getBalance(pubKey);
      const solBalance = balance / 1e9;
      console.log(`✅ Balance fetched: ${solBalance} SOL (${balance} lamports) on ${network}`);
      setBalance(solBalance);
      setBalanceLastUpdated(Date.now());
    } catch (error) {
      console.error(`❌ Failed to get balance on ${network}:`, error);
      
      // If this is mainnet, try alternative RPC providers
      if (network === 'mainnet-beta') {
        console.log('🔄 Trying alternative RPC providers for mainnet...');
        
        // Build list of alternative RPCs, prioritizing Helius if available
        const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY;
        const altRpcs = [];
        
        if (heliusApiKey && heliusApiKey !== 'your_helius_api_key_here') {
          altRpcs.push(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`);
        }
        
        altRpcs.push(
          'https://rpc.ankr.com/solana',
          'https://api.mainnet-beta.solana.com',
          'https://solana-mainnet.g.alchemy.com/v2/demo',
          'https://mainnet.helius-rpc.com/?api-key=demo'
        );
        
        for (let i = 0; i < altRpcs.length; i++) {
          try {
            console.log(`🔄 Trying RPC ${i + 1}/${altRpcs.length}: ${altRpcs[i]}`);
            const altConnection = new Connection(altRpcs[i], {
              commitment: 'confirmed'
            });
            const altBalance = await altConnection.getBalance(pubKey);
            const altSolBalance = altBalance / 1e9;
            console.log(`✅ Alternative RPC ${i + 1} success: ${altSolBalance} SOL`);
            setBalance(altSolBalance);
            setBalanceLastUpdated(Date.now());
            return; // Exit on success
          } catch (altError) {
            console.error(`❌ Alternative RPC ${i + 1} failed:`, altError);
            // Continue to next RPC
          }
        }
        
        // If all alternatives failed
        console.error('❌ All alternative RPCs failed');
        setBalance(0);
      } else {
        setBalance(0);
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Update balance when network changes
  useEffect(() => {
    if (publicKey && connected && !testMode) {
      console.log(`Network changed to ${network}, updating balance for ${publicKey.toString()}`);
      updateBalance(publicKey);
    }
  }, [network, connection, publicKey, connected, testMode]);

  // Apply test mode if enabled
  useEffect(() => {
    if (testMode && testPublicKey) {
      console.log('Test mode enabled, using test public key:', testPublicKey.toString());
      setConnected(true);
      setPublicKey(testPublicKey);
      setBalance(100); // Set a dummy balance for testing
    } else if (!window.solana?.publicKey) {
      // Only reset if not actually connected to a real wallet
      setConnected(false);
      setPublicKey(null);
      setBalance(0);
    }
  }, [testMode, testPublicKey]);

  useEffect(() => {
    // Skip Phantom check if test mode is enabled
    if (testMode) return;
    
    const checkPhantomWallet = async () => {
      const phantom = window.solana;
      const isPhantom = phantom && phantom.isPhantom;
      console.log('Checking Phantom wallet:', { isPhantom });
      setIsPhantomInstalled(!!isPhantom);

      if (isPhantom) {
        try {
          await switchToDevnet();
        } catch (error) {
          console.warn('Failed to switch network:', error);
          // Continue anyway
        }
      }
    };

    checkPhantomWallet();

    const handleConnect = async (publicKey: PublicKey) => {
      console.log('Wallet connected:', publicKey.toString());
      setConnected(true);
      setPublicKey(publicKey);
      await updateBalance(publicKey);
    };

    const handleDisconnect = () => {
      console.log('Wallet disconnected');
      // Don't disconnect if in test mode
      if (!testMode) {
        setConnected(false);
        setPublicKey(null);
        setBalance(0);
      }
    };

    if (window.solana) {
      window.solana.on('connect', handleConnect);
      window.solana.on('disconnect', handleDisconnect);
      window.solana.on('accountChanged', handleConnect);
    }

    return () => {
      if (window.solana) {
        window.solana.off('connect', handleConnect);
        window.solana.off('disconnect', handleDisconnect);
        window.solana.off('accountChanged', handleConnect);
      }
    };
  }, [testMode]);

  const connect = async () => {
    // If test mode is enabled, use the test public key
    if (testMode && testPublicKey) {
      console.log('Test mode enabled, using test public key:', testPublicKey.toString());
      setConnected(true);
      setPublicKey(testPublicKey);
      setBalance(100); // Set a dummy balance for testing
      return;
    }
    
    try {
      const phantom = window.solana;
      if (!phantom) {
        throw new Error('Phantom wallet not installed');
      }

      // Check if already connected
      if (connected && publicKey) {
        console.log('Wallet already connected');
        return;
      }

      console.log('Starting wallet connection sequence...');

      // Clear any existing connection
      if (phantom.publicKey) {
        try {
          console.log('Disconnecting existing session...');
          await phantom.disconnect();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.log('Disconnect error (non-critical):', e);
        }
      }

      console.log('Requesting wallet connection...');
      const response = await phantom.connect();
      
      if (!response || !response.publicKey) {
        throw new Error('Failed to get public key from connection response');
      }

      console.log('Wallet connected with public key:', response.publicKey.toString());

      setConnected(true);
      setPublicKey(response.publicKey);
      await updateBalance(response.publicKey);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setConnected(false);
      setPublicKey(null);
      throw error;
    }
  };

  const disconnect = async () => {
    // If test mode is enabled, don't actually disconnect
    if (testMode) {
      console.log('Test mode enabled, disconnect ignored');
      return;
    }
    
    try {
      const phantom = window.solana;
      if (!phantom) {
        throw new Error('Phantom wallet not installed');
      }

      await phantom.disconnect();
      setConnected(false);
      setPublicKey(null);
      setBalance(0);
    } catch (error) {
      console.error('Wallet disconnect failed:', error);
      throw error;
    }
  };

  const refreshBalance = async () => {
    if (publicKey && !testMode) {
      await updateBalance(publicKey);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connected: testMode ? true : connected,
        publicKey: testMode ? testPublicKey : publicKey,
        balance: testMode ? 100 : balance,
        connect,
        disconnect,
        isPhantomInstalled: testMode ? true : isPhantomInstalled,
        refreshBalance,
        isLoadingBalance,
        balanceLastUpdated: testMode ? Date.now() : balanceLastUpdated,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
