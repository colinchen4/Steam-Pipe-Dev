import React from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// Styled components for consistency
const GlassPanel = styled(Paper)(({ theme }) => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontWeight: 700,
  marginBottom: theme.spacing(4),
}));

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Box sx={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
      py: 4
    }}>
      <PageTitle variant="h4" sx={{ textAlign: 'center', mb: 4 }}>
        {t('settings.title')}
      </PageTitle>
      
      <Grid container spacing={{ xs: 3, sm: 4, md: 6 }} sx={{ justifyContent: 'center' }}>
        <Grid item xs={12} lg={10} xl={8}>
          <GlassPanel>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
              {t('settings.notifications')}
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label={t('settings.tradeUpdates')}
              sx={{ color: 'white', display: 'block', mb: 1 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label={t('settings.enableNotifications')}
              sx={{ color: 'white', display: 'block' }}
            />
          </GlassPanel>
        </Grid>
        
        <Grid item xs={12} lg={10} xl={8}>
          <GlassPanel>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
              Privacy
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Show inventory to public"
              sx={{ color: 'white', display: 'block', mb: 1 }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Allow trade offers from anyone"
              sx={{ color: 'white', display: 'block' }}
            />
          </GlassPanel>
        </Grid>
      </Grid>
    </Box>
  );
};
