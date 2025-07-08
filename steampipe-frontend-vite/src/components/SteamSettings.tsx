import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useWallet } from '../contexts/WalletContext';
import { steamApi } from '../services/api';

interface SteamAccount {
  steamId: string;
  displayName: string;
  avatar: string;
  isConnected: boolean;
}

const SteamSettings: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [steamAccount, setSteamAccount] = useState<SteamAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchSteamAccount = async () => {
    if (!connected || !publicKey) return;

    try {
      setLoading(true);
      setError(null);
      const account = await steamApi.getAccount(publicKey.toString());
      setSteamAccount(account);
    } catch (error) {
      console.error('Error fetching Steam account:', error);
      setError('Failed to fetch Steam account information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchSteamAccount();
    }
  }, [publicKey]);

  const handleUnlinkAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      await steamApi.unbind();
      setSteamAccount(null);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error unlinking Steam account:', error);
      setError('Failed to unlink Steam account');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Please connect your wallet to manage your Steam account.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : steamAccount ? (
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <img
                src={steamAccount.avatar}
                alt={steamAccount.displayName}
                style={{ width: 64, height: 64, borderRadius: '50%' }}
              />
              <Box>
                <Typography variant="h6">{steamAccount.displayName}</Typography>
                <Typography color="textSecondary">
                  Steam ID: {steamAccount.steamId}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenDialog(true)}
            >
              Unlink Steam Account
            </Button>
          </Box>
        ) : (
          <Alert severity="info">
            No Steam account linked. Use the Steam Account Manager to link your account.
          </Alert>
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Unlink Steam Account</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to unlink your Steam account? This will remove
              access to your Steam inventory and trading features.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleUnlinkAccount} color="error">
              Unlink
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export { SteamSettings };
