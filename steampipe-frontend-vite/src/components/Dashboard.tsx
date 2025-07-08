import React from 'react';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  SwapHoriz as SwapIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { OrderStatus } from './OrderStatus';
import { useAuth } from '../contexts/AuthContext';

interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarfull: string;
  loccountrycode?: string;
}

interface User {
  _id: string;
  phantomWalletAddress: string;
  steamId: string;
  steamProfile: SteamProfile;
  steamTradeStatus: {
    status: string;
    lastChecked: Date;
  };
  steamInventoryStatus: {
    isPublic: boolean;
    lastChecked: Date;
  };
}

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to view the dashboard</div>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        Welcome to SteamPipe - The Future of CS:GO Skin Trading
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(96, 165, 250, 0.1)',
                }}
              >
                <TrendingUpIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Typography variant="h6">Market Value</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'text.primary' }}>
              $12,458.00
            </Typography>
            <Typography variant="body2" sx={{ color: 'success.main' }}>
              +15.3% from last month
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(96, 165, 250, 0.1)',
                }}
              >
                <SwapIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Typography variant="h6">Active Trades</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'text.primary' }}>
              24
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              8 pending approvals
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(96, 165, 250, 0.1)',
                }}
              >
                <InventoryIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Typography variant="h6">Inventory Items</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'text.primary' }}>
              156
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              23 new items this week
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="h6">Steam Profile</Typography>
            <Box
              component="img"
              src={user.steamProfile.avatarfull}
              alt="Steam Avatar"
              sx={{ width: '100%', height: 200, objectFit: 'cover' }}
            />
            <Typography variant="h6">{user.steamProfile.personaname}</Typography>
            <Typography variant="body1">Steam ID: {user.steamId}</Typography>
            <Typography variant="body1">
              <a href={user.steamProfile.profileurl} target="_blank" rel="noopener noreferrer">
                View Steam Profile
              </a>
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="h6">Status</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography variant="body1">Trade Status</Typography>
                  <Typography variant="body1" sx={{ color: user.steamTradeStatus?.status?.toLowerCase() === 'active' ? 'success.main' : 'error.main' }}>
                    {user.steamTradeStatus?.status || 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Last checked: {user.steamTradeStatus?.lastChecked ? new Date(user.steamTradeStatus.lastChecked).toLocaleString() : 'Never'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography variant="body1">Inventory Status</Typography>
                  <Typography variant="body1" sx={{ color: user.steamInventoryStatus?.isPublic ? 'success.main' : 'error.main' }}>
                    {user.steamInventoryStatus?.isPublic !== undefined ? (user.steamInventoryStatus.isPublic ? 'Public' : 'Private') : 'Unknown'}
                  </Typography>
                  <Typography variant="body2">
                    Last checked: {user.steamInventoryStatus?.lastChecked ? new Date(user.steamInventoryStatus.lastChecked).toLocaleString() : 'Never'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Connected Wallet</Typography>
            <Typography variant="body1">{user.phantomWalletAddress}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <OrderStatus />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
