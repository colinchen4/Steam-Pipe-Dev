import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import SwapPanel from '../components/trading/SwapPanel';

// Styled components
const GlassPanel = styled(Paper)(({ theme }) => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  height: '100%',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontWeight: 700,
  marginBottom: theme.spacing(3),
}));

const TradingPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Box sx={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      position: 'relative',
      px: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }
    }}>
      {/* Decorative background elements */}
      <Box sx={{
        position: 'absolute',
        top: '-100px',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 50%, rgba(0, 0, 0, 0) 70%)',
        zIndex: -1,
        pointerEvents: 'none',
      }} />
      
      <Box sx={{
        position: 'absolute',
        bottom: '-150px',
        right: '-100px',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.05) 50%, rgba(0, 0, 0, 0) 70%)',
        zIndex: -1,
        pointerEvents: 'none',
      }} />
      
      <PageTitle variant="h4" sx={{ textAlign: 'center', mb: 4, mt: 4 }}>
        {t('trading.pageTitle')}
      </PageTitle>
      
      {/* Main content container */}
      <Grid 
        container 
        spacing={{ xs: 3, sm: 4, md: 5, lg: 6 }}
        justifyContent="center"
      >
        {/* Buy CS:GO Skins panel */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', minHeight: '600px' }}>
          <SwapPanel />
        </Grid>
        
        {/* Recent trades panel */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', minHeight: '600px' }}>
          <GlassPanel sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            <Typography variant="h5" fontWeight="bold" color="white" sx={{ mb: 3 }}>
              {t('trading.recentTrades')}
            </Typography>
            
            <Box sx={{ 
              flex: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'text.secondary'
            }}>
              <Typography>{t('trading.noRecentTrades')}</Typography>
            </Box>
          </GlassPanel>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingPage;
