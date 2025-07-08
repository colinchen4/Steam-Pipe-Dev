import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  Inventory as InventoryIcon,
  SwapHoriz as TradeIcon,
  SwapHoriz as SwapHorizIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const getMenuItems = (t: any) => [
  { text: t('navigation.dashboard'), icon: <HomeIcon />, path: '/dashboard' },
  { text: t('navigation.inventory'), icon: <InventoryIcon />, path: '/inventory' },
  { text: t('navigation.trade'), icon: <TradeIcon />, path: '/trade' },
  { text: t('navigation.trading'), icon: <SwapHorizIcon />, path: '/trading' },
  { text: t('navigation.wallet'), icon: <WalletIcon />, path: '/wallet' },
  { text: t('navigation.compare'), icon: <CompareIcon />, path: '/prices' },
  { text: t('navigation.settings'), icon: <SettingsIcon />, path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = getMenuItems(t);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2, mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            background: (theme) => theme.palette.gradient.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}
        >
          SteamPipe
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                ...(location.pathname === item.path && {
                  background: (theme) => theme.palette.gradient.button,
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'white',
                  },
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === item.path ? 'white' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.9rem',
                    fontWeight: location.pathname === item.path ? 500 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};
