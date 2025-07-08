import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@project-serum/anchor';
import { Connection } from '@solana/web3.js';
import { steamApi, tradingApi, healthApi } from '../services/tradingApi';
import AnchorClientImproved from '../services/anchorClientImproved';
import { SOLANA_RPC_URL } from '../config';
import { SteamItem, TradeStatus } from '../types/api';

const TradingInterface: React.FC = () => {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [steamId, setSteamId] = useState('');
  const [inventory, setInventory] = useState<SteamItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SteamItem | null>(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trades, setTrades] = useState<TradeStatus[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [anchorClient, setAnchorClient] = useState<AnchorClientImproved | null>(null);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  // Initialize Anchor client
  useEffect(() => {
    if (anchorWallet) {
      const connection = new Connection(SOLANA_RPC_URL);
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const client = new AnchorClientImproved(provider);
      setAnchorClient(client);
    }
  }, [anchorWallet]);

  // Check backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await healthApi.check();
        setBackendStatus('online');
      } catch (error) {
        setBackendStatus('offline');
      }
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load Steam inventory
  const loadInventory = async () => {
    if (!steamId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await steamApi.getInventory(steamId);
      if (response.success) {
        setInventory(response.items || []);
        setSuccess('Inventory loaded successfully!');
      } else {
        setError(response.error || 'Failed to load inventory');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // Create listing
  const createListing = async () => {
    if (!selectedItem || !price || !anchorClient) return;
    
    setLoading(true);
    setError('');
    
    try {
      // First verify item ownership
      const verifyResponse = await steamApi.verifyItem(steamId, selectedItem.assetid);
      if (!verifyResponse.success) {
        throw new Error('Item verification failed');
      }

      // Create listing on-chain
      const priceInMicroUSDC = Math.floor(parseFloat(price) * 1000000); // Convert to micro USDC
      const tx = await anchorClient.createListing(
        selectedItem.assetid,
        priceInMicroUSDC,
        selectedItem.market_name
      );
      
      setSuccess(`Listing created! Transaction: ${tx}`);
      setSelectedItem(null);
      setPrice('');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // Initiate trade
  const initiateTrade = async (listingData: any) => {
    if (!anchorClient) return;
    
    setLoading(true);
    setError('');
    
    try {
      const tradeId = Date.now(); // Simple trade ID generation
      const steamTradeUrl = `https://steamcommunity.com/tradeoffer/new/?partner=${steamId}`;
      
      // Initiate trade on-chain
      const tx = await anchorClient.initiateTrade(
        listingData.publicKey,
        listingData.account.seller,
        tradeId,
        steamTradeUrl
      );
      
      // Notify backend to start Steam trade process
      await tradingApi.initiateTrade({
        tradeId,
        escrowAccount: anchorClient.getPublicKeys(tradeId).escrowPDA.toString(),
        sellerSteamId: steamId,
        buyerSteamId: steamId, // In real app, this would be different
        itemId: listingData.account.itemId,
        itemAssetId: listingData.account.itemId,
        amount: listingData.account.price.toNumber(),
      });
      
      setSuccess(`Trade initiated! Transaction: ${tx}`);
      loadTrades();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate trade');
    } finally {
      setLoading(false);
    }
  };

  // Load user trades
  const loadTrades = async () => {
    try {
      const response = await tradingApi.getAllTrades();
      if (response.success && response.data) {
        setTrades(response.data);
      } else {
        setError(response.error || 'Failed to load trades');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load trades');
    }
  };

  // Refund expired trade
  const refundTrade = async (tradeId: string) => {
    if (!anchorClient) return;
    
    setLoading(true);
    setError('');
    
    try {
      const tx = await anchorClient.refundExpired(parseInt(tradeId));
      setSuccess(`Trade refunded! Transaction: ${tx}`);
      loadTrades();
    } catch (err: any) {
      setError(err.message || 'Failed to refund trade');
    } finally {
      setLoading(false);
    }
  };

  // Dispute trade
  const disputeTrade = async (tradeId: string, reason: string) => {
    if (!anchorClient) return;
    
    setLoading(true);
    setError('');
    
    try {
      const tx = await anchorClient.disputeTrade(parseInt(tradeId), reason);
      setSuccess(`Trade disputed! Transaction: ${tx}`);
      loadTrades();
    } catch (err: any) {
      setError(err.message || 'Failed to dispute trade');
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'completed': return 'success';
      case 'disputed': return 'error';
      case 'cancelled': return 'default';
      case 'steamverified': return 'info';
      case 'steamtransferred': return 'warning';
      default: return 'primary';
    }
  };

  const steps = [
    'Connect Steam Account',
    'Load Inventory',
    'Create Listing or Browse Market',
    'Execute Trade',
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CS:GO Skin Trading Platform
      </Typography>
      
      {/* Backend Status */}
      <Alert 
        severity={backendStatus === 'online' ? 'success' : backendStatus === 'offline' ? 'error' : 'info'}
        sx={{ mb: 2 }}
      >
        Backend Status: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
      </Alert>

      {/* Progress Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              {index === 0 && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="Steam ID"
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    fullWidth
                    margin="normal"
                    helperText="Enter your Steam ID (e.g., 76561198000000000)"
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (steamId) {
                        setActiveStep(1);
                      }
                    }}
                    disabled={!steamId}
                    sx={{ mt: 1 }}
                  >
                    Connect Steam
                  </Button>
                </Box>
              )}
              
              {index === 1 && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={loadInventory}
                    disabled={loading || !steamId}
                    sx={{ mr: 1 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Load Inventory'}
                  </Button>
                  <Button
                    onClick={() => setActiveStep(2)}
                    disabled={inventory.length === 0}
                  >
                    Continue
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Steam Inventory */}
      {inventory.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Steam Inventory ({inventory.length} items)
            </Typography>
            <Grid container spacing={2}>
              {inventory.slice(0, 12).map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.assetid}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedItem?.assetid === item.assetid ? '2px solid #1976d2' : '1px solid #e0e0e0'
                    }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent>
                      <img 
                        src={`https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}`}
                        alt={item.name}
                        style={{ width: '100%', height: 'auto', maxHeight: 100 }}
                      />
                      <Typography variant="body2" noWrap>
                        {item.market_name || item.name}
                      </Typography>
                      <Chip 
                        label={item.tradable ? 'Tradable' : 'Not Tradable'}
                        color={item.tradable ? 'success' : 'error'}
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Create Listing */}
      {selectedItem && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Create Listing
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <img 
                src={`https://steamcommunity-a.akamaihd.net/economy/image/${selectedItem.icon_url}`}
                alt={selectedItem.name}
                style={{ width: 60, height: 60, marginRight: 16 }}
              />
              <Box>
                <Typography variant="body1">{selectedItem.market_name || selectedItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Asset ID: {selectedItem.assetid}
                </Typography>
              </Box>
            </Box>
            <TextField
              label="Price (USDC)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              fullWidth
              margin="normal"
              helperText="Enter price in USDC"
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={createListing}
                disabled={loading || !price || !anchorClient}
                sx={{ mr: 1 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Create Listing'}
              </Button>
              <Button onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Active Trades */}
      {trades.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Trades
            </Typography>
            {trades.map((trade) => (
              <Card key={trade.tradeId} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1">
                        Trade #{trade.tradeId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount: {trade.amount / 1000000} USDC
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(trade.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={trade.state}
                        color={getStateColor(trade.state) as any}
                        size="small"
                      />
                      {trade.state === 'FundsLocked' && new Date() > new Date(trade.expiresAt) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => refundTrade(trade.tradeId)}
                        >
                          Refund
                        </Button>
                      )}
                      {(trade.state === 'FundsLocked' || trade.state === 'SteamVerified') && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => disputeTrade(trade.tradeId, 'User dispute')}
                        >
                          Dispute
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TradingInterface;
