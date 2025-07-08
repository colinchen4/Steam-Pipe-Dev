import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Chip, Button, Alert } from '@mui/material';
import { CheckCircle, Error, Warning, Refresh } from '@mui/icons-material';
import { usePrice } from '../contexts/PriceContext';
import { Connection } from '@solana/web3.js';

interface ApiStatusProps {
  compact?: boolean;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ compact = false }) => {
  const { prices, loading, error, refreshPrices, lastUpdated } = usePrice();
  const [heliusStatus, setHeliusStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [rpcStatus, setRpcStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  // Check API configurations
  const heliusApiKey = import.meta.env.VITE_HELIUS_API_KEY;
  const hasHeliusKey = heliusApiKey && heliusApiKey !== 'your_helius_api_key_here';
  const heliusRpcUrl = hasHeliusKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}` : null;

  // Test RPC connection
  const testRpcConnection = async () => {
    if (!heliusRpcUrl) {
      setRpcStatus('error');
      return;
    }

    try {
      const connection = new Connection(heliusRpcUrl, 'confirmed');
      await connection.getLatestBlockhash();
      setRpcStatus('ok');
    } catch (error) {
      console.error('RPC connection test failed:', error);
      setRpcStatus('error');
    }
  };

  // Test Helius API
  const testHeliusApi = async () => {
    if (!hasHeliusKey) {
      setHeliusStatus('error');
      return;
    }

    try {
      // Test with a simple price fetch
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      if (response.ok) {
        setHeliusStatus('ok');
      } else {
        setHeliusStatus('error');
      }
    } catch (error) {
      console.error('API test failed:', error);
      setHeliusStatus('error');
    }
  };

  useEffect(() => {
    testHeliusApi();
    testRpcConnection();
  }, []);

  const getStatusIcon = (status: 'checking' | 'ok' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getStatusColor = (status: 'checking' | 'ok' | 'error') => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          icon={getStatusIcon(heliusStatus)}
          label="Helius"
          color={getStatusColor(heliusStatus)}
          size="small"
        />
        <Chip
          icon={getStatusIcon(rpcStatus)}
          label="RPC"
          color={getStatusColor(rpcStatus)}
          size="small"
        />
        {prices && (
          <Typography variant="caption" color="text.secondary">
            SOL: ${prices.sol.price.toFixed(2)}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">API Status</Typography>
        <Button onClick={refreshPrices} disabled={loading} startIcon={<Refresh />} size="small">
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        {/* Helius API Status */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Helius API
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(heliusStatus)}
            <Typography variant="body2">
              {hasHeliusKey ? 'Configured' : 'Not configured'}
            </Typography>
          </Box>
          {hasHeliusKey && (
            <Typography variant="caption" color="text.secondary">
              Key: {heliusApiKey.substring(0, 8)}...
            </Typography>
          )}
        </Box>

        {/* RPC Status */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            RPC Connection
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(rpcStatus)}
            <Typography variant="body2">
              {rpcStatus === 'ok' ? 'Connected' : rpcStatus === 'error' ? 'Failed' : 'Testing...'}
            </Typography>
          </Box>
        </Box>

        {/* Price Data */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Price Data
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {prices ? <CheckCircle color="success" /> : <Error color="error" />}
            <Typography variant="body2">
              {prices ? 'Available' : 'Not available'}
            </Typography>
          </Box>
          {prices && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                SOL: ${prices.sol.price.toFixed(2)}
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                USDC: ${prices.usdc.price.toFixed(4)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Last Updated */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Last Updated
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ApiStatus;