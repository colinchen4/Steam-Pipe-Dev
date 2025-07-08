import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { NotificationsOutlined as NotificationsIcon } from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';

export const Header: React.FC = () => {
  const { connected, publicKey, balance, connect, disconnect, isPhantomInstalled } = useWallet();

  const handleWalletClick = () => {
    if (!isPhantomInstalled) {
      window.open('https://phantom.app/', '_blank');
    } else {
      connect();
    }
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit" size="large">
            <NotificationsIcon />
          </IconButton>
          {connected ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 1,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.04)',
            }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              >
                {balance.toFixed(2)} SOL
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={disconnect}
                sx={{
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(96, 165, 250, 0.04)',
                  },
                }}
              >
                Disconnect
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={handleWalletClick}
              sx={{
                background: (theme) => theme.palette.gradient.button,
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #0891B2 100%)',
                },
              }}
            >
              {isPhantomInstalled ? 'Connect Wallet' : 'Install Phantom'}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
