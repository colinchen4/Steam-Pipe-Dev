import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { connected, publicKey, connect } = useWallet();
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Connect wallet if not connected
      if (!connected) {
        await connect();
      }

      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Get nonce from backend
      const nonceResponse = await api.get(`/auth/nonce/${publicKey.toString()}`);
      const nonce = nonceResponse.data.nonce;

      // Request signature from wallet
      const message = `Sign this message to login: ${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      const signatureResponse = await window.solana?.request({
        method: 'signMessage',
        params: {
          message: encodedMessage,
          display: 'utf8',
        },
      });

      if (!signatureResponse) {
        throw new Error('Failed to sign message');
      }

      // Verify signature with backend
      const loginResponse = await api.post('/auth/verify', {
        publicKey: publicKey.toString(),
        signature: signatureResponse.signature,
        nonce: nonce
      });

      // Save token
      setToken(loginResponse.data.token);
      
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Login
          </Typography>
          
          <Typography variant="body1" gutterBottom textAlign="center">
            Connect your wallet to continue
          </Typography>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {connected ? 'Sign Message to Login' : 'Connect Wallet'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
