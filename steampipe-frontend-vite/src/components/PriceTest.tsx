import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Divider } from '@mui/material';
import { BACKEND_URL } from '../config';

const API_URL = BACKEND_URL;

const PriceTest: React.FC = () => {
  const [itemName, setItemName] = useState<string>('AK-47 | Redline (Field-Tested)');
  const [loading, setLoading] = useState<boolean>(false);
  const [buff163Data, setBuff163Data] = useState<any>(null);
  const [c5gameData, setC5gameData] = useState<any>(null);
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    setBuff163Data(null);
    setC5gameData(null);
    setAggregatedData(null);

    try {
      // Fetch Buff163 data
      console.log('Fetching Buff163 data...');
      const buff163Response = await axios.get(`${API_URL}/api/market/price/buff163/${encodeURIComponent(itemName)}`);
      console.log('Buff163 response:', buff163Response.data);
      if (buff163Response.data.success) {
        setBuff163Data(buff163Response.data.price);
      }

      // Fetch C5Game data
      console.log('Fetching C5Game data...');
      const c5gameResponse = await axios.get(`${API_URL}/api/market/price/c5game/${encodeURIComponent(itemName)}`);
      console.log('C5Game response:', c5gameResponse.data);
      if (c5gameResponse.data.success) {
        setC5gameData(c5gameResponse.data.price);
      }

      // Fetch aggregated data
      console.log('Fetching aggregated data...');
      const aggregatedResponse = await axios.get(`${API_URL}/api/market/prices/${encodeURIComponent(itemName)}`);
      console.log('Aggregated response:', aggregatedResponse.data);
      if (aggregatedResponse.data.success) {
        setAggregatedData(aggregatedResponse.data.prices);
      }
    } catch (err: any) {
      console.error('Error fetching price data:', err);
      setError(err.message || 'Failed to fetch price data');
    } finally {
      setLoading(false);
    }
  };

  // Format price data for display
  const formatPrice = (data: any) => {
    if (!data) return 'N/A';
    return `${data.price} ${data.currency} (${data.discount}% discount)`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Price Provider Test
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          fullWidth
          variant="outlined"
        />
        <Button 
          variant="contained" 
          onClick={fetchPrices}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Fetch Prices'}
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Buff163 Price Data</Typography>
        {buff163Data ? (
          <Box>
            <Typography><strong>Price:</strong> {buff163Data.price} {buff163Data.currency}</Typography>
            <Typography><strong>Market Price:</strong> {buff163Data.marketPrice} {buff163Data.currency}</Typography>
            <Typography><strong>Discount:</strong> {buff163Data.discount}%</Typography>
            <Typography><strong>Source:</strong> {buff163Data.source}</Typography>
            <Typography><strong>Real-time Data:</strong> {buff163Data.isRealTimeData ? 'Yes' : 'No'}</Typography>
            <Typography><strong>URL:</strong> <a href={buff163Data.url} target="_blank" rel="noopener noreferrer">{buff163Data.url}</a></Typography>
          </Box>
        ) : (
          <Typography color="textSecondary">No Buff163 data available</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>C5Game Price Data</Typography>
        {c5gameData ? (
          <Box>
            <Typography><strong>Price:</strong> {c5gameData.price} {c5gameData.currency}</Typography>
            <Typography><strong>Market Price:</strong> {c5gameData.marketPrice} {c5gameData.currency}</Typography>
            <Typography><strong>Discount:</strong> {c5gameData.discount}%</Typography>
            <Typography><strong>Source:</strong> {c5gameData.source}</Typography>
            <Typography><strong>Real-time Data:</strong> {c5gameData.isRealTimeData ? 'Yes' : 'No'}</Typography>
            <Typography><strong>URL:</strong> <a href={c5gameData.url} target="_blank" rel="noopener noreferrer">{c5gameData.url}</a></Typography>
          </Box>
        ) : (
          <Typography color="textSecondary">No C5Game data available</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Aggregated Price Data</Typography>
        {aggregatedData ? (
          <Box>
            <Typography><strong>Primary Source:</strong> {aggregatedData.source}</Typography>
            <Typography><strong>Price:</strong> {aggregatedData.price} {aggregatedData.currency}</Typography>
            <Typography><strong>Market Price:</strong> {aggregatedData.marketPrice} {aggregatedData.currency}</Typography>
            <Typography><strong>Discount:</strong> {aggregatedData.discount}%</Typography>
            <Typography><strong>Sources:</strong> {aggregatedData.sources?.join(', ') || 'N/A'}</Typography>
            <Typography><strong>Real-time Data:</strong> {aggregatedData.isRealTimeData ? 'Yes' : 'No'}</Typography>
            
            {aggregatedData.avgPrice && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography><strong>Average Price:</strong> {aggregatedData.avgPrice} {aggregatedData.currency}</Typography>
                <Typography><strong>Average Market Price:</strong> {aggregatedData.avgMarketPrice} {aggregatedData.currency}</Typography>
                <Typography><strong>Price Range:</strong> {aggregatedData.priceRange?.min} - {aggregatedData.priceRange?.max} {aggregatedData.currency}</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Typography color="textSecondary">No aggregated data available</Typography>
        )}
      </Paper>
    </Box>
  );
};

export default PriceTest;
