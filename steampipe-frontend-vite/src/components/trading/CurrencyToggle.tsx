import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import SolanaIcon from '../../assets/solana-icon.svg';
import UsdcIcon from '../../assets/usdc-icon.svg';

// Styled components
const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  width: '100%',
  backgroundColor: 'rgba(31, 41, 55, 0.5)',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(0.5),
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    borderRadius: theme.spacing(1),
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
    '&:not(.Mui-selected)': {
      color: theme.palette.text.secondary,
    },
  },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  width: '50%',
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
}));

const CurrencyIcon = styled('img')(() => ({
  width: 20,
  height: 20,
}));

interface CurrencyToggleProps {
  selected: 'SOL' | 'USDC';
  onChange: (currency: 'SOL' | 'USDC') => void;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ selected, onChange }) => {
  const handleChange = (
    _: React.MouseEvent<HTMLElement>,
    newCurrency: 'SOL' | 'USDC' | null
  ) => {
    if (newCurrency !== null) {
      onChange(newCurrency);
    }
  };

  return (
    <Box>
      <StyledToggleButtonGroup
        value={selected}
        exclusive
        onChange={handleChange}
        aria-label="currency selection"
      >
        <StyledToggleButton value="SOL">
          <CurrencyIcon src={SolanaIcon} alt="SOL" />
          <Typography variant="body2" fontWeight={600}>SOL</Typography>
        </StyledToggleButton>
        <StyledToggleButton value="USDC">
          <CurrencyIcon src={UsdcIcon} alt="USDC" />
          <Typography variant="body2" fontWeight={600}>USDC</Typography>
        </StyledToggleButton>
      </StyledToggleButtonGroup>
    </Box>
  );
};

export default CurrencyToggle;
