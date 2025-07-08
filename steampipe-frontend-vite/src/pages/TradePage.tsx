import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { OrderStatus } from '../components/OrderStatus';
import SwapPanel from '../components/trading/SwapPanel';

export const TradePage: React.FC = () => {
  return (
    <Box 
      sx={{ 
        minHeight: 'calc(100vh - 64px)',
        background: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2px, transparent 0)',
        backgroundSize: '100px 100px',
        backgroundPosition: '0 0',
        pt: 4,
        pb: 8
      }}
    >
      {/* Main Swap Panel */}
      <SwapPanel />
      
      {/* Active Orders Section */}
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
          Your Active Orders
        </Typography>
        
        <Paper 
          sx={{ 
            p: 3, 
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <OrderStatus />
        </Paper>
      </Container>
    </Box>
  );
};
