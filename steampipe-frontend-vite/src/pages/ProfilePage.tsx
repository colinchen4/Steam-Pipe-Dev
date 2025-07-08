import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useWallet } from '../contexts/WalletContext';
import SteamAccountManager from '../components/SteamAccountManager';

// Styled components for consistency
const GlassPanel = styled(Paper)(({ theme }) => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
}));

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { connected, publicKey } = useWallet();

  return (
    <Box sx={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
      py: 4
    }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4, color: 'white', fontWeight: 700 }}>
        {t('profile.title')}
      </Typography>
      
      <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} sx={{ justifyContent: 'center' }}>
        <Grid item xs={12} md={10} lg={8} xl={6}>
          <GlassPanel>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
              {t('profile.steamAccount')}
            </Typography>
            <SteamAccountManager />
          </GlassPanel>
        </Grid>
        
        {connected && publicKey && (
          <Grid item xs={12} md={10} lg={8} xl={6}>
            <GlassPanel>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
                {t('wallet.address')}
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', wordBreak: 'break-all' }}>
                {publicKey.toString()}
              </Typography>
            </GlassPanel>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export { ProfilePage };
