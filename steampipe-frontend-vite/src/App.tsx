import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Switch, FormControlLabel, Button, Menu, MenuItem } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';
import { TestModeProvider, useTestMode } from './contexts/TestModeContext';
import { NetworkProvider, useNetwork } from './contexts/NetworkContext';
import { PriceProvider } from './contexts/PriceContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { WalletPage } from './pages/WalletPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ErrorPage } from './pages/ErrorPage';
import PriceComparisonPage from './pages/PriceComparisonPage';
import PriceTest from './components/PriceTest';
import TradingInterface from './components/TradingInterface';
import TradingPage from './pages/TradingPage';
import TopNavLayout from './components/layout/TopNavLayout';
import NetworkWarningModal from './components/NetworkWarningModal';
import theme from './theme/theme';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);

  return connected ? <>{children}</> : null;
};

const AppContent: React.FC = () => {
  const { connected } = useWallet();

  // If not connected, show landing page
  if (!connected) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // If connected, show the app with TopNavLayout
  return (
    <TopNavLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/trade" />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trade"
          element={
            <ProtectedRoute>
              <TradingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <PriceComparisonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trading"
          element={
            <ProtectedRoute>
              <TradingInterface />
            </ProtectedRoute>
          }
        />
        <Route
          path="/price-test"
          element={
            <ProtectedRoute>
              <PriceTest />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </TopNavLayout>
  );
};

// Test mode toggle component
const TestModeToggle: React.FC = () => {
  const { testMode, enableTestMode, disableTestMode } = useTestMode();

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      enableTestMode();
    } else {
      disableTestMode();
    }
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '8px 12px',
        borderRadius: '4px',
        color: 'white'
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={testMode}
            onChange={handleToggle}
            color="primary"
          />
        }
        label="Test Mode"
      />
    </Box>
  );
};

// Language switcher component
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('steampipe-language', language);
    handleClose();
  };

  const currentLanguage = i18n.language || 'en';
  const languageLabels = {
    en: 'EN',
    zh: '中文'
  };

  return (
    <>
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 140, 
          right: 20, 
          zIndex: 9999,
          backgroundColor: 'rgba(63, 81, 181, 0.8)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '2px solid #3f51b5'
        }}
      >
        <Button
          onClick={handleClick}
          size="small"
          sx={{ 
            color: 'white',
            minWidth: 'auto',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          🌐 {languageLabels[currentLanguage as keyof typeof languageLabels] || 'EN'}
        </Button>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleLanguageChange('en')}>
          English
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('zh')}>
          中文 (Chinese)
        </MenuItem>
      </Menu>
    </>
  );
};

// Network toggle component
const NetworkToggle: React.FC = () => {
  const { network, setNetwork, networkLabel, isMainnet } = useNetwork();
  const [showWarning, setShowWarning] = React.useState(false);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const wantsMainnet = event.target.checked;
    
    if (wantsMainnet) {
      // Show warning modal before switching to mainnet
      setShowWarning(true);
    } else {
      // Switch to devnet immediately (no warning needed)
      setNetwork('devnet');
    }
  };

  const handleConfirmMainnet = () => {
    setNetwork('mainnet-beta');
    setShowWarning(false);
  };

  const handleCancelMainnet = () => {
    setShowWarning(false);
    // Keep current network (don't change the switch)
  };

  return (
    <>
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 80, 
          right: 20, 
          zIndex: 9999,
          backgroundColor: isMainnet ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 193, 7, 0.8)',
          padding: '8px 12px',
          borderRadius: '4px',
          color: 'white',
          border: `2px solid ${isMainnet ? '#4caf50' : '#ffc107'}`
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={isMainnet}
              onChange={handleToggle}
              color={isMainnet ? 'success' : 'warning'}
            />
          }
          label={`${networkLabel} ${isMainnet ? '🟢' : '🟡'}`}
        />
      </Box>

      <NetworkWarningModal
        open={showWarning}
        onConfirm={handleConfirmMainnet}
        onCancel={handleCancelMainnet}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TestModeProvider>
        <NetworkProvider>
          <PriceProvider>
            <WalletProvider>
              <AuthProvider>
                <BrowserRouter>
                  <AppContent />
                  <TestModeToggle />
                  <NetworkToggle />
                  <LanguageSwitcher />
                </BrowserRouter>
              </AuthProvider>
            </WalletProvider>
          </PriceProvider>
        </NetworkProvider>
      </TestModeProvider>
    </ThemeProvider>
  );
};

export default App;
