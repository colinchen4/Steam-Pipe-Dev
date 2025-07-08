import React from 'react';
import { Box, Typography, Paper, Grid, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { useNetwork } from '../contexts/NetworkContext';
import { usePrice } from '../contexts/PriceContext';
import { timeAgo, getUpdateStatusColor } from '../utils/timeAgo';
import ApiStatus from '../components/ApiStatus';
import PriceTestComponent from '../components/PriceTestComponent';

export const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { connected, publicKey, balance, connect, disconnect, refreshBalance, balanceLastUpdated } = useWallet();
  const { networkLabel, isMainnet } = useNetwork();
  const { solPrice, solToUsd, loading: priceLoading } = usePrice();

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <Box sx={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
      py: 4
    }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        {t('wallet.title')}
      </Typography>
      
      <ApiStatus />
      
      <PriceTestComponent />
      
      <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} sx={{ justifyContent: 'center' }}>
        <Grid item xs={12} md={10} lg={8} xl={6}>
          <Paper sx={{ 
            p: 4,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}>
            <Typography variant="h6" gutterBottom>
              {t('wallet.connectedWallet')}
            </Typography>
            {connected && publicKey ? (
              <>
                <Typography sx={{ mb: 2, wordBreak: 'break-all' }}>
                  {t('wallet.address')}: {publicKey.toString()}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={handleDisconnectWallet}
                  sx={{ mt: 1 }}
                >
                  {t('wallet.disconnectWallet')}
                </Button>
              </>
            ) : (
              <>
                <Typography sx={{ mb: 2 }}>
                  {t('wallet.noWalletConnected')}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleConnectWallet}
                  sx={{ mt: 1 }}
                >
                  {t('wallet.connectWallet')}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
        
        {connected && (
          <Grid item xs={12} md={10} lg={8} xl={6}>
            <Paper sx={{ 
              p: 4,
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" gutterBottom>
                  {t('wallet.balance')}
                </Typography>
                <Tooltip title={t('wallet.refreshBalance')}>
                  <IconButton 
                    onClick={refreshBalance}
                    size="small"
                    sx={{ color: 'primary.main' }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ color: 'primary.main' }}>
                    {balance.toFixed(4)} SOL
                  </Typography>
                  {solPrice > 0 && (
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
                      ≈ ${solToUsd(balance).toFixed(2)} USD
                    </Typography>
                  )}
                </Box>
                <Chip 
                  label={networkLabel}
                  color={isMainnet ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('wallet.network')}: {networkLabel} {isMainnet ? t('wallet.realMoney') : t('wallet.testNetwork')}
                </Typography>
                {solPrice > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t('wallet.solPrice')}: ${solPrice.toFixed(2)} {priceLoading && '🔄'}
                  </Typography>
                )}
              </Box>
              {balanceLastUpdated && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('wallet.balanceUpdated', { time: timeAgo(balanceLastUpdated) })}
                  </Typography>
                  <Chip
                    size="small"
                    label={getUpdateStatusColor(balanceLastUpdated) === 'success' ? t('wallet.fresh') : 
                           getUpdateStatusColor(balanceLastUpdated) === 'warning' ? t('wallet.recent') : t('wallet.stale')}
                    color={getUpdateStatusColor(balanceLastUpdated) as any}
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
