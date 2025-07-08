import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Avatar,
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { SteamIcon } from '../icons/SteamIcon';
import { useWallet } from '../contexts/WalletContext';
import { useSearchParams } from 'react-router-dom';

interface SteamAccountManagerProps {
  onUpdate?: () => void;
}

interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarfull: string;
}

interface UserData {
  steamProfile?: SteamProfile;
  steamId?: string;
}

const SteamAccountManager: React.FC<SteamAccountManagerProps> = ({ onUpdate }) => {
  const { t } = useTranslation();
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchUserData = async () => {
    if (!connected || !publicKey) return;

    try {
      setLoading(true);
      setError(null);
      const walletAddress = publicKey.toString();
      console.log('Fetching user data for wallet:', walletAddress);
      
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile?wallet=${walletAddress}`, {
        withCredentials: true
      });
      
      console.log('User data received:', response.data);
      setUserData(response.data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(t('profile.failedToLoadUserData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [connected, publicKey]);

  // Handle Steam OpenID callback
  useEffect(() => {
    const handleSteamCallback = async () => {
      const openidNs = searchParams.get('openid.ns');
      const steamId = searchParams.get('openid.claimed_id')?.split('/').pop();
      
      if (openidNs && steamId && connected && publicKey) {
        try {
          setLoading(true);
          setError(null);
          
          // Complete Steam authentication
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/steam/verify`, {
            wallet: publicKey.toString(),
            steamId: steamId
          }, {
            withCredentials: true
          });
          
          // Refresh user data
          await fetchUserData();
        } catch (err) {
          console.error('Error completing Steam authentication:', err);
          setError(t('profile.failedToCompleteSteamAuth'));
        } finally {
          setLoading(false);
        }
      }
    };

    handleSteamCallback();
  }, [searchParams, connected, publicKey]);

  const handleConnectSteam = () => {
    if (!connected || !publicKey) {
      setError(t('errors.selectItemAndWallet'));
      return;
    }

    // Redirect to Steam OpenID login
    const steamLoginUrl = `${import.meta.env.VITE_BACKEND_URL}/api/auth/steam?wallet=${publicKey.toString()}`;
    window.location.href = steamLoginUrl;
  };

  const handleUnbindSteam = async () => {
    if (!connected || !publicKey) {
      setError(t('errors.selectItemAndWallet'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const walletAddress = publicKey.toString();
      
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/steam/unbind`, 
        { wallet: walletAddress },
        { withCredentials: true }
      );

      // Refresh user data
      await fetchUserData();
      setOpenDialog(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error unbinding Steam account:', err);
      setError(t('profile.failedToUnbindSteam'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (userData?.steamProfile) {
    return (
      <>
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={userData.steamProfile.avatarfull}
              alt={userData.steamProfile.personaname}
              sx={{ width: 80, height: 80 }}
            />
            <Box>
              <Typography variant="h6">{userData.steamProfile.personaname}</Typography>
              <Typography variant="body2" color="textSecondary">
                {t('profile.steamId')}: {userData.steamId}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Link
                  href={userData.steamProfile.profileurl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('profile.viewSteamProfile')}
                </Link>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setOpenDialog(true)}
                >
                  {t('profile.unlinkSteamAccount')}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
        >
          <DialogTitle>{t('profile.unlinkSteamAccount')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('profile.confirmUnlinkSteam')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleUnbindSteam} color="error" variant="contained">
              {t('profile.unlinkSteamAccount')}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Button
        variant="contained"
        onClick={handleConnectSteam}
        startIcon={<SteamIcon />}
        disabled={loading || !connected}
        fullWidth
      >
        {t('profile.linkSteamAccount')}
      </Button>
      {!connected && (
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          {t('errors.selectItemAndWallet')}
        </Typography>
      )}
    </Paper>
  );
};

export default SteamAccountManager;
