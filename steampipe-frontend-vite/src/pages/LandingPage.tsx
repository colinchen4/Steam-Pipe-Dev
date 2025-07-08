import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Paper, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import {
  Security as SecurityIcon,
  Speed as SpeedIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';

// Styled components for glassmorphic design
const GlassPanel = styled(Paper)(({ theme }) => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  textAlign: 'center',
  height: '100%',
}));

const GradientTitle = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
  marginBottom: theme.spacing(3),
}));

const ConnectButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
  color: 'white',
  padding: theme.spacing(1.5, 4),
  fontSize: '1.2rem',
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0 8px 32px rgba(56, 189, 248, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    boxShadow: '0 12px 40px rgba(56, 189, 248, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'rgba(56, 189, 248, 0.3)',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  transition: 'all 0.3s ease',
}));

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { connect, isPhantomInstalled } = useWallet();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    // Use isPhantomInstalled from useWallet hook instead of directly accessing window.solana
    if (!isPhantomInstalled) {
      setError(t('errors.phantomNotInstalled'));
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      setError(null);
      setIsConnecting(true);
      
      // Attempt connection with better error handling
      await connect().catch((error: any) => {
        if (error.message?.includes('User rejected')) {
          throw new Error('Connection cancelled by user. Please try again.');
        } else if (error.message?.includes('Failed to switch to devnet')) {
          throw new Error('Unable to switch to devnet. Please manually switch to devnet in your Phantom wallet and try again.');
        } else if (error.message?.includes('timeout')) {
          throw new Error('Connection timed out. Please check your internet connection and try again.');
        }
        throw error;
      });

      // Only navigate if connection was successful
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: t('landing.features.secureTransactions'),
      description: t('landing.features.secureTransactionsDesc'),
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: t('landing.features.nftTrading'),
      description: t('landing.features.nftTradingDesc'),
    },
    {
      icon: <SwapIcon sx={{ fontSize: 40 }} />,
      title: t('landing.features.priceComparison'),
      description: t('landing.features.priceComparisonDesc'),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Connect Wallet Button - Top Right Corner */}
      <Box sx={{
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 10,
      }}>
        <ConnectButton
          onClick={handleConnect}
          disabled={isConnecting}
          sx={{
            fontSize: '1rem',
            padding: '12px 24px',
          }}
        >
          {isConnecting ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              {t('common.loading')}
            </>
          ) : !isPhantomInstalled ? (
            'Install Phantom'
          ) : (
            t('wallet.connectWallet')
          )}
        </ConnectButton>
      </Box>

      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 50%, rgba(0, 0, 0, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      
      <Box sx={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(0, 0, 0, 0) 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Main Content Area - Full Width */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        py: { xs: 8, md: 10 },
      }}>
        {/* Hero Section */}
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mb: { xs: 8, md: 10, lg: 12 },
          px: { xs: 3, sm: 4, md: 6 },
        }}>
          <GradientTitle
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
              mb: 2,
              textAlign: 'center',
            }}
          >
            {t('landing.title')}
          </GradientTitle>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            {t('landing.description')}
          </Typography>
        </Box>

        {/* Features Section - Spread Wide */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '100%',
          px: { xs: 3, sm: 6, md: 8, lg: 10, xl: 12 },
        }}>
          <Grid 
            container 
            spacing={{ xs: 4, sm: 6, md: 8, lg: 12, xl: 16 }} 
            sx={{ 
              justifyContent: 'center',
              maxWidth: '100%',
            }}
          >
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} lg={4} xl={4} key={index} sx={{ 
                display: 'flex',
                justifyContent: 'center',
              }}>
                <Box sx={{ 
                  width: '100%', 
                  maxWidth: { xs: '100%', sm: '400px', md: '350px', lg: '400px', xl: '450px' },
                }}>
                  <GlassPanel>
                    <Box sx={{ mb: 2, color: '#38bdf8', fontSize: { xs: 40, md: 48, lg: 56 } }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 'bold',
                        color: 'white',
                        fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' },
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: { xs: '1rem', md: '1.1rem', lg: '1.2rem' },
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </GlassPanel>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};
