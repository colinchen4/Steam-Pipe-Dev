import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import PriceComparisonDashboard from '../components/PriceComparisonDashboard';

const PageTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontWeight: 700,
  marginBottom: theme.spacing(4),
}));

const PriceComparisonPage: React.FC = () => {
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
        {t('priceComparison.title')}
      </PageTitle>
      
      <PriceComparisonDashboard />
    </Box>
  );
};

export default PriceComparisonPage;
