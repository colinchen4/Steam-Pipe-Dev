import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export const ErrorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const errorMessage = searchParams.get('message') || 'An error occurred';

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Oops! Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {errorMessage}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
