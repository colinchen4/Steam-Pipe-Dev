import React, { createContext, useContext, useState, useEffect } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';

export type SolanaNetwork = 'devnet' | 'mainnet-beta';

interface NetworkContextType {
  network: SolanaNetwork;
  connection: Connection;
  setNetwork: (network: SolanaNetwork) => void;
  isMainnet: boolean;
  networkLabel: string;
}

const NetworkContext = createContext<NetworkContextType>({
  network: 'devnet',
  connection: new Connection(clusterApiUrl('devnet')),
  setNetwork: () => {},
  isMainnet: false,
  networkLabel: 'Devnet',
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<SolanaNetwork>('devnet');
  const [connection, setConnection] = useState<Connection>(
    new Connection(clusterApiUrl('devnet'), {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    })
  );

  const setNetwork = (newNetwork: SolanaNetwork) => {
    setNetworkState(newNetwork);
    
    // Create new connection for the selected network
    let rpcUrl: string;
    if (newNetwork === 'mainnet-beta') {
      // Check if Helius API key is available
      const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY;
      
      if (heliusApiKey && heliusApiKey !== 'your_helius_api_key_here') {
        // Use Helius RPC if API key is configured
        rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
        console.log('Using Helius RPC for mainnet');
      } else {
        // Fallback to alternative RPC providers
        const mainnetRpcs = [
          'https://rpc.ankr.com/solana',
          'https://api.mainnet-beta.solana.com',
          'https://solana-mainnet.g.alchemy.com/v2/demo',
          'https://mainnet.helius-rpc.com/?api-key=demo'
        ];
        rpcUrl = mainnetRpcs[0];
        console.log('Using fallback RPC for mainnet (consider getting a Helius API key)');
      }
    } else {
      rpcUrl = clusterApiUrl('devnet');
    }
    
    console.log(`Switching to ${newNetwork} with RPC: ${rpcUrl}`);
      
    setConnection(new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    }));

    // Store preference in localStorage
    localStorage.setItem('solana_network', newNetwork);
  };

  // Load saved network preference on init
  useEffect(() => {
    const savedNetwork = localStorage.getItem('solana_network') as SolanaNetwork;
    if (savedNetwork && (savedNetwork === 'devnet' || savedNetwork === 'mainnet-beta')) {
      setNetwork(savedNetwork);
    }
  }, []);

  const value: NetworkContextType = {
    network,
    connection,
    setNetwork,
    isMainnet: network === 'mainnet-beta',
    networkLabel: network === 'mainnet-beta' ? 'Mainnet' : 'Devnet',
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};