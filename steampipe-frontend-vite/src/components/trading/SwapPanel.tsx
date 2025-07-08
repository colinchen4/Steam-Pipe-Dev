import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  AlertProps
} from '@mui/material';
import { useWallet } from '../../contexts/WalletContext';
import { usePrice } from '../../contexts/PriceContext';
import { useTranslation } from 'react-i18next';
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@project-serum/anchor';
import { SOLANA_RPC_URL } from '../../config';
import AnchorClientImproved from '../../services/anchorClientImproved';
import { SteamItem } from '../../types/api';
import ItemSelector from './ItemSelector';
import CurrencyToggle from './CurrencyToggle';
import { styled } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';

// Styled components for the glass panel effect
const GlassPanel = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(15, 23, 42, 0.7)',
  backdropFilter: 'blur(12px)',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  position: 'relative',
}));

const GlowButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.8) 0%, rgba(14, 165, 233, 0.8) 100%)',
  color: theme.palette.common.white,
  fontWeight: 600,
  padding: `${theme.spacing(1.5)} ${theme.spacing(3)}`,
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  fontSize: '1rem',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: -100,
    width: '50px',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transform: 'skewX(-15deg)',
    animation: 'shimmer 3s infinite',
  },
  '@keyframes shimmer': {
    '0%': { left: '-100px' },
    '100%': { left: '200%' },
  },
  '&:hover': {
    background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.9) 0%, rgba(14, 165, 233, 0.9) 100%)',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%)',
    color: 'rgba(255, 255, 255, 0.5)',
    boxShadow: 'none',
    transform: 'none',
  },
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SkinImage = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1e293b, #0f172a)',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));



const ToolButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const GlassAlert = styled((props: AlertProps) => (
  <Alert
    elevation={6}
    variant="filled"
    {...props}
  />
))(({ theme, severity }) => ({
  borderRadius: theme.spacing(1.5),
  backdropFilter: 'blur(12px)',
  backgroundColor: severity === 'error' 
    ? 'rgba(239, 68, 68, 0.85)' 
    : severity === 'success'
    ? 'rgba(34, 197, 94, 0.85)'
    : 'rgba(56, 189, 248, 0.85)',
  color: theme.palette.common.white,
  '& .MuiAlert-icon': {
    color: theme.palette.common.white,
  },
}));

const SwapPanel: React.FC = () => {
  const { t } = useTranslation();
  const { publicKey, connected } = useWallet();
  const { solPrice, usdcPrice, solToUsd, usdToSol } = usePrice();
  const [selectedItem, setSelectedItem] = useState<SteamItem | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<'SOL' | 'USDC'>('SOL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [anchorClient, setAnchorClient] = useState<AnchorClientImproved | null>(null);
  const [price, setPrice] = useState<{ sol: number; usdc: number }>({ sol: 0, usdc: 0 });

  // Initialize Anchor client
  useEffect(() => {
    if (connected && publicKey) {
      // For now, we'll disable the Anchor client since we're using our custom wallet context
      // In a real implementation, you would need to create a mock wallet adapter
      // or refactor AnchorClientImproved to work with Phantom wallet directly
      console.log('Anchor client disabled for custom wallet context');
      setAnchorClient(null);
    }
  }, [connected, publicKey]);

  // Set price when item is selected
  useEffect(() => {
    if (selectedItem && solPrice > 0) {
      // Use real SOL price from price service
      const usdPrice = parseFloat(selectedItem.price || '50'); // Default to $50 if no price
      const solAmount = usdToSol(usdPrice);
      
      setPrice({
        sol: solAmount,
        usdc: usdPrice
      });
    }
  }, [selectedItem, solPrice, usdToSol]);

  const handleBuy = async () => {
    if (!selectedItem || !connected || !publicKey) {
      setError(t('errors.selectItemAndWallet'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock purchase transaction - in real implementation this would call your backend/blockchain
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      const mockTxId = 'mockTx_' + Date.now();
      setSuccess(`Successfully purchased ${selectedItem.market_name}! Transaction: ${mockTxId.substring(0, 8)}...`);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Panel Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="white">{t('trading.buyCSGOSkins')}</Typography>
        <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Main Swap Panel */}
      <GlassPanel elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <PanelHeader>
          <Typography variant="h6" color="white">{t('trading.buyCSGOSkins')}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToolButton size="small">
              <SettingsIcon fontSize="small" />
            </ToolButton>
            <ToolButton size="small">
              <MenuIcon fontSize="small" />
            </ToolButton>
          </Box>
        </PanelHeader>
        
        {/* Item Selection */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('trading.selectSkin')}
          </Typography>
          <ItemSelector 
            selectedItem={selectedItem} 
            onSelectItem={setSelectedItem} 
          />
        </Box>
        
        {/* Item Details (only shown when item is selected) */}
        {selectedItem && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <SkinImage sx={{ 
              width: '100%', 
              height: 192,
              mb: 2,
              borderRadius: 2
            }}>
              <img 
                src={selectedItem.icon_url} 
                alt={selectedItem.market_name} 
                style={{ height: '100%', width: '100%', objectFit: 'contain' }} 
              />
            </SkinImage>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">{t('trading.floatValue')}</Typography>
              <Typography variant="body2" color="white">
                {selectedItem.float_value || '0.0134'} ({selectedItem.wear_name || 'Factory New'})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">{t('trading.seller')}</Typography>
              <Typography variant="body2" color="white" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedItem.owner || 'Gh7B...9pQr'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">{t('trading.expiresIn')}</Typography>
              <Typography variant="body2" color="white">6 {t('trading.days')}, 23 {t('trading.hours')}</Typography>
            </Box>
          </Box>
        )}
        
        {/* Price and Buy Section */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">{t('trading.youPay')}</Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight="medium" color="white">
                {paymentCurrency === 'SOL' 
                  ? `${price.sol.toFixed(4)} SOL` 
                  : `${price.usdc.toFixed(2)} USDC`}
              </Typography>
              {paymentCurrency === 'SOL' && solPrice > 0 && (
                <Typography variant="body2" color="text.secondary">
                  ≈ ${solToUsd(price.sol).toFixed(2)} USD
                </Typography>
              )}
              {paymentCurrency === 'USDC' && solPrice > 0 && (
                <Typography variant="body2" color="text.secondary">
                  ≈ {usdToSol(price.usdc).toFixed(4)} SOL
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Currency Toggle */}
          <CurrencyToggle 
            selected={paymentCurrency} 
            onChange={setPaymentCurrency} 
          />
          
          {/* Buy Button */}
          <Box sx={{ mt: 3 }}>
            <GlowButton
              variant="contained"
              disabled={!selectedItem || loading || !connected}
              onClick={handleBuy}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? t('trading.processing') : t('trading.buyNow')}
            </GlowButton>
            
            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
              {t('trading.platformFee')}
            </Typography>
          </Box>
        </Box>
      </GlassPanel>
      
      {/* Browse All Button */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button 
          sx={{ 
            textTransform: 'none', 
            color: '#38bdf8', 
            fontWeight: 500,
            '&:hover': { 
              color: '#0ea5e9',
              backgroundColor: 'rgba(56, 189, 248, 0.1)'
            },
            borderRadius: 1.5,
            padding: '8px 16px'
          }}
        >
          {t('trading.browseAllListings')}
        </Button>
      </Box>
      
      {/* Notifications */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <GlassAlert onClose={handleCloseAlert} severity="error">
          {error}
        </GlassAlert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <GlassAlert onClose={handleCloseAlert} severity="success">
          {success}
        </GlassAlert>
      </Snackbar>
    </Box>
  );
};

export default SwapPanel;
