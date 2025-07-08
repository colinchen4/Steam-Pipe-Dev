import React from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { usePrice } from '../contexts/PriceContext';
import { timeAgo, getUpdateStatusColor } from '../utils/timeAgo';

export const PriceDisplay: React.FC = () => {
  const { solPrice, loading, error, lastUpdated } = usePrice();

  if (error) {
    return (
      <Chip 
        label="Price Error" 
        color="error" 
        size="small" 
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  if (loading || solPrice === 0) {
    return (
      <Chip 
        label="Loading..." 
        color="default" 
        size="small" 
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  const timeSinceUpdate = lastUpdated ? Date.now() - lastUpdated : 0;
  const isStale = timeSinceUpdate > 60000; // 1 minute

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : 'No data'}>
        <Chip 
          label={`SOL $${solPrice.toFixed(2)}`}
          color={getUpdateStatusColor(lastUpdated) as any}
          size="small"
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        />
      </Tooltip>
      {lastUpdated && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {timeAgo(lastUpdated)}
        </Typography>
      )}
      {loading && (
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          🔄
        </Typography>
      )}
    </Box>
  );
};