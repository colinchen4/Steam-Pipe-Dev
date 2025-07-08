import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useWallet } from '../../contexts/WalletContext';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SettingsIcon from '@mui/icons-material/Settings';
import { PriceDisplay } from '../PriceDisplay';

// Styled components
const GlassAppBar = styled(AppBar)(() => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: 'none',
}));

// Create a custom NavButton that works with React Router
const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: theme.palette.common.white,
  },
  '&.active': {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    color: '#38bdf8',
  },
}));

// Custom NavLink component that combines Button with React Router Link
interface NavLinkProps {
  to: string;
  startIcon?: React.ReactNode;
  isActive?: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, startIcon, isActive, children }) => {
  const navigate = useNavigate();
  
  return (
    <NavButton
      onClick={() => navigate(to)}
      startIcon={startIcon}
      className={isActive ? 'active' : ''}
    >
      {children}
    </NavButton>
  );
}

const ConnectWalletButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(56, 189, 248, 0.2)',
  color: '#38bdf8',
  borderRadius: theme.spacing(1.5),
  padding: `${theme.spacing(0.75)} ${theme.spacing(2)}`,
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'none',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  backdropFilter: 'blur(4px)',
  '&:hover': {
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
}));

const WalletAddress = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(31, 41, 55, 0.7)',
  borderRadius: theme.spacing(1.5),
  padding: `${theme.spacing(0.75)} ${theme.spacing(2)}`,
  color: theme.palette.common.white,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(4px)',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
}));

const ToolButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: theme.palette.common.white,
  },
}));

interface TopNavLayoutProps {
  children: React.ReactNode;
  activePage?: 'dashboard' | 'inventory' | 'trade' | 'wallet' | 'compare' | 'settings';
}

const TopNavLayout: React.FC<TopNavLayoutProps> = ({ children, activePage }) => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active page from URL if not provided
  const pathname = location.pathname;
  const currentPage = activePage || pathname.split('/')[1] || 'dashboard';

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.1) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.1) 2px, transparent 0)',
        backgroundSize: '100px 100px',
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      {/* App bar with centered content */}
      <GlassAppBar position="sticky">
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 2, sm: 3, md: 4 } }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 700, 
                    mr: 4, 
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/')}
                >
                  SteamPipe
                </Typography>
                
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                  <NavLink 
                    to="/dashboard" 
                    startIcon={<DashboardIcon />}
                    isActive={pathname === '/dashboard'}
                  >
                    Dashboard
                  </NavLink>
                  
                  <NavLink 
                    to="/inventory" 
                    startIcon={<InventoryIcon />}
                    isActive={pathname === '/inventory'}
                  >
                    Inventory
                  </NavLink>
                  
                  <NavLink 
                    to="/trade" 
                    startIcon={<SwapHorizIcon />}
                    isActive={pathname === '/trade'}
                  >
                    Trade
                  </NavLink>
                  
                  <NavLink 
                    to="/wallet" 
                    startIcon={<AccountBalanceWalletIcon />}
                    isActive={pathname === '/wallet'}
                  >
                    Wallet
                  </NavLink>
                  
                  <NavLink 
                    to="/compare" 
                    startIcon={<CompareArrowsIcon />}
                    isActive={pathname === '/compare'}
                  >
                    Compare
                  </NavLink>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PriceDisplay />
                
                {!publicKey ? (
                  <ConnectWalletButton 
                    onClick={() => navigate('/connect')}
                  >
                    Connect Wallet
                  </ConnectWalletButton>
                ) : (
                  <Tooltip title={publicKey.toString()}>
                    <WalletAddress>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 6px #10b981'
                        }} 
                      />
                      <Typography variant="body2" fontWeight={500}>
                        {publicKey.toString().substring(0, 4)}...{publicKey.toString().substring(publicKey.toString().length - 4)}
                      </Typography>
                    </WalletAddress>
                  </Tooltip>
                )}
                
                <ToolButton>
                  <SettingsIcon />
                </ToolButton>
              </Box>
            </Toolbar>
          </Box>
        </Box>
      </GlassAppBar>
      
      {/* Content area with fixed width and centered */}
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        mt: 4,
        position: 'relative',
        zIndex: 1
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default TopNavLayout;
