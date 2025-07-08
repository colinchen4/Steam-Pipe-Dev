import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardMedia, 
  CardContent, 
  Button,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { 
  Search as SearchIcon,
  AccountBalanceWallet as WalletIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Token as NftIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { usePrice } from '../contexts/PriceContext';
import axios from 'axios';

interface SkinItem {
  id: string;
  name: string;
  market_name: string;
  icon_url: string;
  rarity: string;
  type: string;
  wear?: string;
  float_value?: number;
  price_usd?: number;
  tradable: boolean;
  isListed?: boolean;           // Listed on platform
  listingPrice?: number;        // Price in SOL
  listingCurrency?: 'SOL' | 'USDC';
}

interface InventoryStats {
  total_items: number;
  total_value_usd: number;
  tradable_items: number;
  listed_items: number;
}

const rarityColors = {
  'Consumer Grade': '#b0c3d9',
  'Industrial Grade': '#5e98d9',
  'Mil-Spec Grade': '#4b69ff',
  'Restricted': '#8847ff',
  'Classified': '#d32ce6',
  'Covert': '#eb4b4b',
  'Contraband': '#e4ae39'
};

export const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { connected, publicKey } = useWallet();
  const { solPrice, usdToSol, solToUsd } = usePrice();
  const [inventory, setInventory] = useState<SkinItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  // Helper function to convert USD price to SOL with live rates
  const convertUsdToSol = (usdPrice: number): number => {
    return solPrice > 0 ? usdPrice / solPrice : 0;
  };

  // Helper function to format SOL price
  const formatSolPrice = (usdPrice: number): string => {
    const solAmount = convertUsdToSol(usdPrice);
    return solAmount.toFixed(3);
  };

  const fetchInventory = async () => {
    if (!connected || !publicKey) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll create mock inventory data since Steam inventory API
      // requires additional setup and permissions
      const mockInventory: SkinItem[] = [
        {
          id: '1',
          name: 'AK-47 | Redline',
          market_name: 'AK-47 | Redline (Field-Tested)',
          icon_url: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyUItgNw3OzF9JrxjVC2-kZpNW6lcNeRdQQ9NFvZ-wS9yb_vgJC5vZXJzSA3vCcq5HaOzBPl1gYMMLKgPPSCww',
          rarity: 'Classified',
          type: 'Rifle',
          wear: 'Field-Tested',
          float_value: 0.23,
          price_usd: 67.50,
          tradable: true,
        },
        {
          id: '2',
          name: 'M4A4 | Howl',
          market_name: 'M4A4 | Howl (Field-Tested)',
          icon_url: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_d2xh7-Gw_alDLPIgnUJscZw2LGVpY-jjQXlqhE-YjuiI4CcJgRsMA_Y_VLqkLy705G4vJybmyd9-n51Gvkc_Q',
          rarity: 'Contraband',
          type: 'Rifle',
          wear: 'Field-Tested',
          float_value: 0.16,
          price_usd: 3850.00,
          tradable: true,
          isListed: true,
          listingPrice: 15.2,
          listingCurrency: 'SOL'
        },
        {
          id: '3',
          name: 'AWP | Dragon Lore',
          market_name: 'AWP | Dragon Lore (Minimal Wear)',
          icon_url: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GoIsZdw2LyS99z02FXt80JqY2Dxd9LGJAc2YQyE-AO2xOq5hJK1vp6dy3NnuiAjsGGdwUK6rB5ZFw',
          rarity: 'Covert',
          type: 'Sniper Rifle',
          wear: 'Minimal Wear',
          float_value: 0.08,
          price_usd: 4200.00,
          tradable: true
        },
        {
          id: '4',
          name: 'Karambit | Fade',
          market_name: 'Karambit | Fade (Factory New)',
          icon_url: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlY20k_jkI6_Cg3tU18l4jeHVyoD8j1yg-0Y4amn2I9fAdAE2YA2B_VHtlebvjcS7tJrOynZgvCIj5nvZnhSpwUYbC4KfgQ',
          rarity: 'Covert',
          type: 'Knife',
          wear: 'Factory New',
          float_value: 0.03,
          price_usd: 1850.00,
          tradable: true
        },
        {
          id: '5',
          name: 'Glock-18 | Water Elemental',
          market_name: 'Glock-18 | Water Elemental (Factory New)',
          icon_url: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf2rz3fzhF6cqJmImMn-O6NbfFhFRC68doteHV8AnwjlWxrktpNmmmI4TEdQU3ZA3U_1i2yO7phMLutJzAzCEwsnYh5S3ZzUXkhB1LcKUx0rU_R48s',
          rarity: 'Restricted',
          type: 'Pistol',
          wear: 'Factory New',
          float_value: 0.06,
          price_usd: 12.50,
          tradable: true
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInventory(mockInventory);
      
      // Calculate stats
      const calculatedStats: InventoryStats = {
        total_items: mockInventory.length,
        total_value_usd: mockInventory.reduce((sum, item) => sum + (item.price_usd || 0), 0),
        tradable_items: mockInventory.filter(item => item.tradable).length,
        listed_items: mockInventory.filter(item => item.isListed).length
      };
      
      setStats(calculatedStats);
      
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(t('errors.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchInventory();
    }
  }, [connected, publicKey]);

  const filteredAndSortedInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.market_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'tradable') return matchesSearch && item.tradable;
      if (filterBy === 'listed') return matchesSearch && item.isListed;
      if (filterBy === 'unlisted') return matchesSearch && !item.isListed;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return (b.price_usd || 0) - (a.price_usd || 0);
        case 'rarity':
          return a.rarity.localeCompare(b.rarity);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SkinItem | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingCurrency, setListingCurrency] = useState<'SOL' | 'USDC'>('SOL');

  const handleListItem = (item: SkinItem) => {
    setSelectedItem(item);
    setShowListingModal(true);
    // Set default listing price based on market value
    const defaultPrice = listingCurrency === 'SOL' 
      ? convertUsdToSol(item.price_usd || 0)
      : item.price_usd || 0;
    setListingPrice(defaultPrice.toFixed(3));
  };

  const handleConfirmListing = async () => {
    if (!selectedItem || !listingPrice) return;
    
    try {
      // Update the item as listed
      const updatedInventory = inventory.map(item => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            isListed: true,
            listingPrice: parseFloat(listingPrice),
            listingCurrency
          };
        }
        return item;
      });
      
      setInventory(updatedInventory);
      
      // Update stats
      const updatedStats: InventoryStats = {
        total_items: updatedInventory.length,
        total_value_usd: updatedInventory.reduce((sum, item) => sum + (item.price_usd || 0), 0),
        tradable_items: updatedInventory.filter(item => item.tradable).length,
        listed_items: updatedInventory.filter(item => item.isListed).length
      };
      
      setStats(updatedStats);
      
      // Close modal
      setShowListingModal(false);
      setSelectedItem(null);
      setListingPrice('');
      
      console.log(`✅ Listed ${selectedItem.name} for ${listingPrice} ${listingCurrency}`);
      
    } catch (error) {
      console.error('❌ Failed to list item:', error);
    }
  };

  if (!connected) {
    return (
      <Box sx={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 80px)',
        px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
        py: 4
      }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4, color: 'white', fontWeight: 700 }}>
          {t('navigation.inventory')}
        </Typography>
        
        <Alert severity="warning" sx={{ 
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {t('wallet.noWalletConnected')}
          </Typography>
          <Typography>
            {t('errors.selectItemAndWallet')}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 80px)',
      px: { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
      py: 4
    }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4, color: 'white', fontWeight: 700 }}>
        {t('navigation.inventory')}
      </Typography>

      {/* Stats Section */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InventoryIcon sx={{ color: '#38bdf8' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.total_items}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory.totalItems')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ color: '#10b981' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {formatSolPrice(stats.total_value_usd)} SOL
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${stats.total_value_usd.toFixed(0)} USD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory.totalValue')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WalletIcon sx={{ color: '#f59e0b' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.tradable_items}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory.tradable')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NftIcon sx={{ color: '#8b5cf6' }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {stats.listed_items}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory.listed')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Controls Section */}
      <Paper sx={{ p: 3, mb: 4, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('inventory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { color: 'white' } }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white' }}>{t('inventory.sortBy')}</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value="name">{t('inventory.name')}</MenuItem>
                <MenuItem value="price">{t('inventory.price')}</MenuItem>
                <MenuItem value="rarity">{t('inventory.rarity')}</MenuItem>
                <MenuItem value="type">{t('inventory.type')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white' }}>{t('inventory.filter')}</InputLabel>
              <Select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                sx={{ color: 'white' }}
              >
                <MenuItem value="all">{t('inventory.allItems')}</MenuItem>
                <MenuItem value="tradable">{t('inventory.tradableOnly')}</MenuItem>
                <MenuItem value="listed">{t('inventory.listedOnly')}</MenuItem>
                <MenuItem value="unlisted">{t('inventory.unlistedOnly')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#38bdf8' }} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Inventory Items */}
      {!loading && !error && (
        <Grid container spacing={3}>
          {filteredAndSortedInventory.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card sx={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.7)', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderTop: `3px solid ${rarityColors[item.rarity as keyof typeof rarityColors] || '#666'}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <CardMedia
                  component="img"
                  height="120"
                  image={item.icon_url}
                  alt={item.name}
                  sx={{ objectFit: 'contain', p: 1 }}
                />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ color: 'white', fontSize: '0.9rem', mb: 1 }}>
                    {item.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    <Chip 
                      label={item.rarity} 
                      size="small" 
                      sx={{ 
                        backgroundColor: rarityColors[item.rarity as keyof typeof rarityColors] || '#666',
                        color: 'white',
                        fontSize: '0.7rem'
                      }} 
                    />
                    <Chip 
                      label={item.type} 
                      size="small" 
                      sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem' }} 
                    />
                    {item.wear && (
                      <Chip 
                        label={item.wear} 
                        size="small" 
                        sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem' }} 
                      />
                    )}
                  </Box>

                  {item.float_value && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {t('inventory.float')}: {item.float_value.toFixed(4)}
                    </Typography>
                  )}

                  {item.price_usd && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#10b981', mb: 0.5 }}>
                        {formatSolPrice(item.price_usd)} SOL
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ${item.price_usd.toFixed(2)} USD
                      </Typography>
                      {solPrice > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          @ ${solPrice.toFixed(2)}/SOL
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {item.isListed ? (
                      <Button 
                        variant="contained" 
                        size="small" 
                        disabled
                        sx={{ backgroundColor: '#10b981' }}
                      >
                        {t('inventory.listed')}
                      </Button>
                    ) : item.tradable ? (
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleListItem(item)}
                        sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}
                      >
                        {t('inventory.listForSale')}
                      </Button>
                    ) : (
                      <Button 
                        variant="outlined" 
                        size="small"
                        disabled
                        sx={{ borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        {t('inventory.notTradable')}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && filteredAndSortedInventory.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('inventory.noItemsFound')}
          </Typography>
          <Typography color="text.secondary">
            {searchQuery ? t('inventory.adjustFilters') : t('inventory.connectSteam')}
          </Typography>
        </Paper>
      )}

      {/* Listing Modal */}
      <Dialog 
        open={showListingModal} 
        onClose={() => setShowListingModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {t('inventory.listItem')}
        </DialogTitle>
        
        {selectedItem && (
          <DialogContent sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <img 
                src={selectedItem.icon_url} 
                alt={selectedItem.name}
                style={{ width: 60, height: 60, objectFit: 'contain' }}
              />
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 0.5 }}>
                  {selectedItem.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Market: ${selectedItem.price_usd?.toFixed(2)} USD
                </Typography>
              </Box>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
                {t('inventory.listingCurrency')}
              </Typography>
              <RadioGroup
                value={listingCurrency}
                onChange={(e) => {
                  const newCurrency = e.target.value as 'SOL' | 'USDC';
                  setListingCurrency(newCurrency);
                  // Update price when currency changes
                  if (selectedItem.price_usd) {
                    const newPrice = newCurrency === 'SOL' 
                      ? convertUsdToSol(selectedItem.price_usd)
                      : selectedItem.price_usd;
                    setListingPrice(newPrice.toFixed(3));
                  }
                }}
                row
              >
                <FormControlLabel 
                  value="SOL" 
                  control={<Radio sx={{ color: '#10b981' }} />} 
                  label={<Typography sx={{ color: 'white' }}>SOL</Typography>}
                />
                <FormControlLabel 
                  value="USDC" 
                  control={<Radio sx={{ color: '#10b981' }} />} 
                  label={<Typography sx={{ color: 'white' }}>USDC</Typography>}
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              fullWidth
              label={t('inventory.listingPrice')}
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography sx={{ color: 'text.secondary' }}>
                      {listingCurrency}
                    </Typography>
                  </InputAdornment>
                ),
                sx: { color: 'white' }
              }}
              InputLabelProps={{
                sx: { color: 'text.secondary' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.4)'
                  }
                }
              }}
            />
            
            {listingPrice && selectedItem.price_usd && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {listingCurrency === 'SOL' ? (
                    <>Market equivalent: ~{formatSolPrice(selectedItem.price_usd)} SOL</>
                  ) : (
                    <>Market equivalent: ~${selectedItem.price_usd.toFixed(2)} USD</>
                  )}
                </Typography>
                {solPrice > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Current SOL price: ${solPrice.toFixed(2)}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
        )}
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button 
            onClick={() => setShowListingModal(false)}
            sx={{ color: 'text.secondary' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmListing}
            variant="contained"
            disabled={!listingPrice || parseFloat(listingPrice) <= 0}
            sx={{ 
              backgroundColor: '#10b981', 
              '&:hover': { backgroundColor: '#059669' },
              '&:disabled': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
            }}
          >
            {t('inventory.confirmListing')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
