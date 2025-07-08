import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { Warning, AttachMoney, Security, Info } from '@mui/icons-material';

interface NetworkWarningModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const NetworkWarningModal: React.FC<NetworkWarningModalProps> = ({
  open,
  onConfirm,
  onCancel
}) => {
  const { t } = useTranslation();
  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="md"
      PaperProps={{
        sx: {
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        color: '#ffc107', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        fontWeight: 700
      }}>
        <Warning /> 
        {t('network.mainnetWarningTitle')}
      </DialogTitle>
      
      <DialogContent>
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            '& .MuiAlert-icon': { color: '#ffc107' },
            '& .MuiAlert-message': { color: 'white' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            ⚠️ {t('network.switchingToMainnet')}
          </Typography>
          <Typography>
            {t('network.mainnetWarningMessage')}
          </Typography>
        </Alert>

        <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
          Here's what changes when you switch to Mainnet:
        </Typography>

        <List>
          <ListItem>
            <ListItemIcon>
              <AttachMoney sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Real Balance Display"
              secondary="You'll see your actual SOL balance from your wallet"
              secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }}
              primaryTypographyProps={{ color: 'white' }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Security sx={{ color: '#ff9800' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Transaction Costs"
              secondary="Any blockchain transactions will cost real SOL (~$0.001-$20)"
              secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }}
              primaryTypographyProps={{ color: 'white' }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Info sx={{ color: '#2196f3' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Demo Safe"
              secondary="You can safely view balances and navigate - no automatic transactions"
              secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }}
              primaryTypographyProps={{ color: 'white' }}
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600 }}>
            💡 Recommendation: Use this for demos to show real balances, but switch back to Devnet for testing transactions.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onCancel}
          variant="outlined"
          sx={{ 
            color: 'white', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { borderColor: 'white' }
          }}
        >
          {t('network.stayOnDevnet')}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          sx={{ 
            backgroundColor: '#4caf50',
            '&:hover': { backgroundColor: '#45a049' }
          }}
        >
          {t('network.understand')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NetworkWarningModal;