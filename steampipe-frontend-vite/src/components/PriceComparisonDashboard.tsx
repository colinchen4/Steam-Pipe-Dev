import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { timeAgo, formatLastUpdated, getUpdateStatusColor } from '../utils/timeAgo';

// Define types for price data
interface PriceData {
  source: string;
  price: number;
  marketPrice: number;
  discount: number;
  currency: string;
  url?: string;
  isFallback?: boolean;
  accuracy?: 'historical' | 'estimated' | 'unavailable' | 'error' | 'real-time';
  status?: 'online' | 'offline' | 'coming-soon';
  errorMessage?: string;
  timestamp?: string;
}

interface ProviderStatus {
  name: string;
  status: 'online' | 'offline' | 'coming-soon';
  lastUpdated?: string;
}

const PriceComparisonDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [popularItems] = useState<string[]>([
    'AK-47 | Redline (Field-Tested)',
    'AWP | Asiimov (Field-Tested)',
    'Desert Eagle | Blaze (Factory New)',
    'Butterfly Knife | Doppler (Factory New)',
    'M4A4 | The Emperor (Factory New)'
  ]);

  const API_URL = BACKEND_URL;

  // Fetch provider status on component mount and set up periodic refresh
  useEffect(() => {
    fetchProviderStatus();
    
    // Refresh provider status every 30 seconds
    const intervalId = setInterval(() => {
      fetchProviderStatus();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchProviderStatus = async () => {
    try {
      console.log('Fetching provider status...');
      const response = await axios.get(`${API_URL}/api/prices/providers`);
      console.log('Provider status response:', response.data);
      
      if (response.data && response.data.success) {
        const providerData = response.data.data.providers.map((provider: any) => {
          // Check if the provider has an 'available' property, otherwise use 'enabled'
          const isAvailable = provider.hasOwnProperty('available') 
            ? provider.available 
            : (provider.enabled || false);
            
          return {
            name: provider.name,
            status: isAvailable ? 'online' : 'offline',
            lastUpdated: provider.lastUpdated
          };
        });
        
        console.log('Processed provider data:', providerData);
        setProviders(providerData);
      } else {
        console.error('Failed to fetch provider status: Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch provider status:', err);
    }
  };



  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter an item name to search');
      return;
    }

    setLoading(true);
    setError(null);
    setItemName(searchTerm);

    try {
      // First, ensure we have the latest provider status
      await fetchProviderStatus();
      
      console.log('Searching for item:', searchTerm);
      
      // Use the aggregated price endpoint that includes individual provider data
      const response = await axios.get(`${API_URL}/api/prices/item/${encodeURIComponent(searchTerm)}`);
      console.log('Price API Response:', response.data);
      
      if (response.data && response.data.success) {
        const result = response.data.data;
        const processedData: PriceData[] = [];
        
        // Process individual provider data if available
        if (result.providerData) {
          console.log('Processing provider data:', result.providerData);
          
          // Add data for each provider
          Object.entries(result.providerData).forEach(([providerName, providerInfo]: [string, any]) => {
            processedData.push({
              source: providerName,
              price: providerInfo.price || 0,
              marketPrice: providerInfo.marketPrice || providerInfo.price || 0,
              discount: providerInfo.discount || 0,
              currency: providerInfo.currency || 'USD',
              url: providerInfo.url,
              accuracy: providerInfo.accuracy || (providerInfo.isRealTimeData ? 'real-time' : 'estimated'),
              timestamp: providerInfo.timestamp,
              isFallback: false
            });
          });
        } else {
          // Fallback to main result if no provider data
          processedData.push({
            source: result.source,
            price: result.price,
            marketPrice: result.marketPrice || result.price,
            discount: result.discount || 0,
            currency: result.currency || 'USD',
            url: result.url,
            accuracy: result.accuracy || 'real-time',
            isFallback: false
          });
        }
        
        // Add providers that don't have data but are online
        providers.forEach(provider => {
          const hasData = processedData.some(data => data.source === provider.name);
          if (!hasData && provider.status === 'online') {
            processedData.push({
              source: provider.name,
              price: 0,
              marketPrice: 0,
              discount: 0,
              currency: 'USD',
              status: provider.status,
              accuracy: 'unavailable',
              errorMessage: `No data available for this item from ${provider.name}`
            });
          }
        });
        
        // Sort the data by price (lowest first), but put unavailable sources at the end
        processedData.sort((a, b) => {
          // Put unavailable sources at the end
          if (a.accuracy === 'unavailable' && b.accuracy !== 'unavailable') return 1;
          if (a.accuracy !== 'unavailable' && b.accuracy === 'unavailable') return -1;
          
          // Sort by price
          return a.price - b.price;
        });
        
        console.log('Final processed data:', processedData);
        setPriceData(processedData);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch price data');
      }
    } catch (err: any) {
      console.error('Error fetching price data:', err);
      setError(`Failed to fetch price data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (item: string) => {
    setSearchTerm(item);
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleRefresh = () => {
    if (itemName) {
      handleSearch();
    }
  };

  const formatPrice = (price: number, currency: string = 'USD'): string => {
    if (price === 0) return '-';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(price);
  };

  const formatDiscount = (discount: number): string => {
    if (discount === 0) return '-';
    return `${discount > 0 ? '+' : ''}${discount.toFixed(2)}%`;
  };

  const getAccuracyLabel = (accuracy?: string): string => {
    switch (accuracy) {
      case 'real-time': return 'Real-time';
      case 'historical': return 'Historical';
      case 'estimated': return 'Estimated';
      case 'unavailable': return 'Unavailable';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getAccuracyColor = (accuracy?: string): string => {
    switch (accuracy) {
      case 'real-time': return 'success';
      case 'historical': return 'info';
      case 'estimated': return 'warning';
      case 'unavailable': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'coming-soon': return 'warning';
      default: return 'default';
    }
  };

  const findBestPrice = (): PriceData | null => {
    if (!priceData || priceData.length === 0) return null;
    
    // Filter out providers with no price or unavailable
    const availablePrices = priceData.filter(item => 
      item.price > 0 && 
      item.accuracy !== 'unavailable' && 
      item.accuracy !== 'error'
    );
    
    if (availablePrices.length === 0) return null;
    
    // Find the lowest price
    return availablePrices.reduce((best, current) => {
      // Convert all prices to USD for comparison if needed
      const currentPrice = current.price;
      const bestPrice = best.price;
      
      return currentPrice < bestPrice ? current : best;
    }, availablePrices[0]);
  };

  // Add a useEffect to log diagnostic information about missing providers
  useEffect(() => {
    if (priceData.length > 0) {
      // Log which providers are missing from the price data
      const missingProviders = providers
        .filter(provider => !priceData.some(item => item.source === provider.name))
        .map(provider => provider.name);
      
      if (missingProviders.length > 0) {
        console.log('Providers missing from price data:', missingProviders);
      }
    }
  }, [priceData, providers]);

  const bestPrice = findBestPrice();

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Price Comparison Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Compare prices across multiple marketplaces including Buff163, C5Game, and Steam
      </Typography>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search for an item"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. AK-47 | Redline (Field-Tested)"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              disabled={loading || !itemName}
            >
              Refresh
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={fetchProviderStatus}
              startIcon={<CompareArrowsIcon />}
              disabled={loading}
            >
              Check Providers
            </Button>
          </Grid>
        </Grid>

        {/* Popular items */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Popular Items:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {popularItems.map((item) => (
              <Chip
                key={item}
                label={item}
                onClick={() => handleQuickSearch(item)}
                clickable
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Provider Status */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Provider Status
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {providers.map((provider) => (
            <Chip
              key={provider.name}
              label={provider.name}
              color={getStatusColor(provider.status) as any}
              variant="outlined"
              icon={provider.status === 'online' ? <TrendingUpIcon /> : undefined}
            />
          ))}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Provider Information:
        </Typography>
        
        <Grid container spacing={2}>
          {providers.map((provider) => (
            <Grid item xs={12} sm={6} md={4} key={`info-${provider.name}`}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {provider.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {provider.status === 'online' ? 'Available' : 'Unavailable'}
                  </Typography>
                  {provider.status === 'online' && (
                    <Typography variant="body2" color="text.secondary">
                      {provider.name === 'C5Game' && 
                        'C5Game API is connected but may not have data for all items.'}
                      {provider.name === 'Buff163' && 
                        'Buff163 API is connected but may not have data for all items.'}
                      {provider.name === 'Steam' && 
                        'Steam Market prices are available for most items.'}
                      {provider.name === 'UUYP' && 
                        'UUYP may use fallback price estimation when item data is unavailable.'}
                      {provider.name === 'Skinport' && 
                        'Skinport API is connected but may be rate limited.'}
                      {provider.name === 'EcoSteam' && 
                        'EcoSteam API connection issues detected.'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Price Comparison Results */}
      {itemName && (
        <Card>
          <CardHeader
            title={`Price Comparison: ${itemName}`}
            subheader={lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : 'Fetching prices...'}
            action={
              <Tooltip title="Refresh prices">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : priceData.length === 0 ? (
              <Alert severity="info">
                No price data available for this item. Try another search term.
              </Alert>
            ) : (
              <>
                {/* Best Price Banner */}
                {bestPrice && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h6" color="white">
                      Best Price: {formatPrice(bestPrice.price, bestPrice.currency)} from {bestPrice.source}
                    </Typography>
                  </Box>
                )}

                {/* Price Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Source</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Market Price</TableCell>
                        <TableCell align="right">Discount</TableCell>
                        <TableCell align="center">Accuracy</TableCell>
                        <TableCell align="center">Last Updated</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {priceData.map((item, index) => (
                        <TableRow key={`${item.source}-${index}`} sx={{ 
                          bgcolor: bestPrice && item.source === bestPrice.source ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                        }}>
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                sx={{
                                  fontWeight: item.price > 0 ? 'bold' : 'normal',
                                  color: item.price === 0 ? 'text.secondary' : 'inherit'
                                }}
                              >
                                {item.source}
                              </Typography>
                              {item.status && (
                                <Tooltip title={`Provider status: ${item.status}`}>
                                  <Chip
                                    size="small"
                                    label={item.status}
                                    color={getStatusColor(item.status) as any}
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                </Tooltip>
                              )}
                              {item.price === 0 && (
                                <Tooltip title={item.errorMessage || "No data available from this provider for this item"}>
                                  <Chip
                                    size="small"
                                    label={item.isFallback ? "Fallback" : "No data"}
                                    color={item.isFallback ? "warning" : "default"}
                                    variant="outlined"
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatPrice(item.price, item.currency)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPrice(item.marketPrice, item.currency)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              color={item.discount > 0 ? 'success.main' : item.discount < 0 ? 'error.main' : 'text.secondary'}
                            >
                              {formatDiscount(item.discount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={getAccuracyLabel(item.accuracy)}
                              color={getAccuracyColor(item.accuracy) as any}
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {item.timestamp ? (
                              <Tooltip title={new Date(item.timestamp).toLocaleString()}>
                                <Chip
                                  size="small"
                                  label={timeAgo(item.timestamp)}
                                  color={getUpdateStatusColor(item.timestamp) as any}
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Unknown
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {item.url ? (
                              <Button
                                size="small"
                                variant="outlined"
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </Button>
                            ) : (
                              <Button size="small" variant="outlined" disabled>
                                N/A
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default PriceComparisonDashboard;
