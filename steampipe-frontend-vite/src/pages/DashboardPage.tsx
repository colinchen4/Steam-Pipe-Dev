import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import SteamAccountManager from '../components/SteamAccountManager';

// Styled components
const GlassPanel = styled(Paper)(({ theme }) => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
  marginBottom: theme.spacing(3),
}));

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        width: '100%'
      }}>
        <Typography variant="h5" align="center" color="text.secondary">
          {t('dashboard.connectWalletMessage')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: '1400px', 
      margin: '0 auto',
      px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 } // Add responsive padding
    }}>
      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        <Grid item xs={12} lg={10} xl={8}> {/* Add responsive grid constraints */}
          <GlassPanel>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <PageTitle variant="h4">
                {t('dashboard.welcome')}
              </PageTitle>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {t('dashboard.connectedWallet')}: {publicKey.toString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.description')}
            </Typography>
          </GlassPanel>
        </Grid>
        <Grid item xs={12} lg={10} xl={8}>
          <SteamAccountManager />
        </Grid>
      </Grid>
    </Box>
  );
};
