import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';

interface TestModeContextType {
  testMode: boolean;
  enableTestMode: () => void;
  disableTestMode: () => void;
  testPublicKey: PublicKey | null;
}

const TestModeContext = createContext<TestModeContextType>({
  testMode: false,
  enableTestMode: () => {},
  disableTestMode: () => {},
  testPublicKey: null,
});

export const useTestMode = () => useContext(TestModeContext);

export const TestModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [testMode, setTestMode] = useState(false);
  // Create a fixed test public key for consistency
  const [testPublicKey] = useState<PublicKey | null>(
    new PublicKey('8YUYRpzgKmMkdYwSP9pFu8fULvYvHRhUZK7mLRLYDPT8')
  );

  // Check if test mode was previously enabled
  useEffect(() => {
    const savedTestMode = localStorage.getItem('testMode');
    if (savedTestMode === 'true') {
      setTestMode(true);
    }
  }, []);

  const enableTestMode = () => {
    setTestMode(true);
    localStorage.setItem('testMode', 'true');
  };

  const disableTestMode = () => {
    setTestMode(false);
    localStorage.setItem('testMode', 'false');
  };

  return (
    <TestModeContext.Provider
      value={{
        testMode,
        enableTestMode,
        disableTestMode,
        testPublicKey,
      }}
    >
      {children}
    </TestModeContext.Provider>
  );
};

export default TestModeProvider;
