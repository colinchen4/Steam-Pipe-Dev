import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  Popover, 
  List, 
  ListItem, 
  Typography, 
  Tabs, 
  Tab,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { usePrice } from '../../contexts/PriceContext';
import { SteamItem } from '../../types/api';

// Styled components
const SelectorButton = styled(Button)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5),
  backgroundColor: 'rgba(31, 41, 55, 0.8)',
  borderRadius: theme.spacing(1.5),
  '&:hover': {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
  },
  textTransform: 'none',
  color: theme.palette.common.white,
}));

const SkinImage = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.spacing(1),
  background: 'linear-gradient(45deg, #1e293b, #0f172a)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(55, 65, 81, 0.8)',
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: 'rgba(75, 85, 99, 0.8)',
  },
  marginRight: theme.spacing(1),
  height: 28,
  fontSize: '0.75rem',
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: theme.spacing(1.5),
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
  },
  '& .MuiInputBase-input': {
    color: theme.palette.common.white,
  },
  '& .MuiInputAdornment-root': {
    color: theme.palette.text.secondary,
  },
}));

const StyledPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: theme.spacing(1.5),
    overflow: 'hidden',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.common.white,
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
  },
  minHeight: 40,
  textTransform: 'none',
}));

interface ItemSelectorProps {
  selectedItem: SteamItem | null;
  onSelectItem: (item: SteamItem) => void;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ selectedItem, onSelectItem }) => {
  const { t } = useTranslation();
  const { solPrice, usdToSol, solToUsd } = usePrice();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [items, setItems] = useState<SteamItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SteamItem[]>([]);
  const [loading] = useState(false);

  const open = Boolean(anchorEl);

  // Helper function to convert USD price to SOL with live rates
  const convertUsdToSol = (usdPrice: string | number): number => {
    const usd = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
    return solPrice > 0 ? usd / solPrice : 0;
  };

  // Helper function to format SOL price
  const formatSolPrice = (usdPrice: string | number): string => {
    const solAmount = convertUsdToSol(usdPrice);
    return solAmount.toFixed(3);
  };

  // Mock data for testing
  const mockItems: SteamItem[] = [
    {
      assetid: '1',
      classid: '123456',
      instanceid: '654321',
      amount: '1',
      pos: 1,
      id: '123456_654321_1',
      name: 'AWP | Dragon Lore',
      market_name: 'AWP | Dragon Lore',
      market_hash_name: 'AWP | Dragon Lore (Factory New)',
      icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdsZGHyd4_Bd1RvNQ7T_FDrw-_ng5Pu75iY1zI97bhLsvQz/360fx360f',
      tradable: true,
      marketable: true,
      price: '102.45',
      wear_name: 'Factory New',
      float_value: '0.0134',
      owner: 'Gh7B...9pQr'
    },
    {
      assetid: '2',
      classid: '123457',
      instanceid: '654322',
      amount: '1',
      pos: 2,
      id: '123457_654322_1',
      name: 'AK-47 | Fire Serpent',
      market_name: 'AK-47 | Fire Serpent',
      market_hash_name: 'AK-47 | Fire Serpent (Minimal Wear)',
      icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV08-jhIWZlP_1IbzUklRd4cJ5ntbN9J7yjRrh_UY-Yjz2I4OScwJsZliGrlK6k-3vjcO-78nBmnFn7Ckj-z-DyAETpE-d/360fx360f',
      tradable: true,
      marketable: true,
      price: '44.30',
      wear_name: 'Minimal Wear',
      float_value: '0.1203',
      owner: 'Jk9L...2mNp'
    },
    {
      assetid: '3',
      classid: '123458',
      instanceid: '654323',
      amount: '1',
      pos: 3,
      id: '123458_654323_1',
      name: 'M4A4 | Howl',
      market_name: 'M4A4 | Howl',
      market_hash_name: 'M4A4 | Howl (Field-Tested)',
      icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7cqWdQ-sJ0xOzAot-jiQa3-BFsYDymJNCdcgFqYg3WqFe_lOm-jJG76pjIynAyvXUq4X7D30vgYky2sFc/360fx360f',
      tradable: true,
      marketable: true,
      price: '71.20',
      wear_name: 'Field-Tested',
      float_value: '0.2341',
      owner: 'Lm3P...8sQr'
    },
    {
      assetid: '4',
      classid: '123459',
      instanceid: '654324',
      amount: '1',
      pos: 4,
      id: '123459_654324_1',
      name: 'AK-47 | Vulcan',
      market_name: 'AK-47 | Vulcan',
      market_hash_name: 'AK-47 | Vulcan (Factory New)',
      icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5hJCOg-P1IbzUklRd4cJ5ntbN9J7yjRrh_UU9Zm_yJtOUIAE9ZwyB-wW_xOvs1pK56JrIyiQxvyEq-z-DyAETLz-9/360fx360f',
      tradable: true,
      marketable: true,
      price: '27.35',
      wear_name: 'Factory New',
      float_value: '0.0089',
      owner: 'Bn5K...7pRt'
    },
    {
      assetid: '5',
      classid: '123460',
      instanceid: '654325',
      amount: '1',
      pos: 5,
      id: '123460_654325_1',
      name: 'AWP | Asiimov',
      market_name: 'AWP | Asiimov',
      market_hash_name: 'AWP | Asiimov (Field-Tested)',
      icon_url: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7cqWdQ-sJ0xOzAot-jiQa3-BFsYDymJNCdcgFqYg3WqFe_lOm-jJG76pjIynAyvXUq4X7D30vgYky2sFc/360fx360f',
      tradable: true,
      marketable: true,
      price: '16.02',
      wear_name: 'Field-Tested',
      float_value: '0.2178',
      owner: 'Kp2J...4tRs'
    }
  ];

  // Load items on component mount
  useEffect(() => {
    // In a real app, you would fetch items from your backend
    // For now, we'll use mock data
    setItems(mockItems);
    setFilteredItems(mockItems);
  }, []);

  // Filter items when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => 
      item.market_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectItem = (item: SteamItem) => {
    onSelectItem(item);
    handleClose();
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // In a real app, you would filter items based on the tab
  };

  return (
    <>
      <SelectorButton onClick={handleClick} color="inherit">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {selectedItem ? (
            <>
              <SkinImage>
                <img 
                  src={selectedItem.icon_url} 
                  alt={selectedItem.market_name} 
                  style={{ height: '100%', width: '100%', objectFit: 'contain' }} 
                />
              </SkinImage>
              <Typography sx={{ ml: 1.5 }}>{selectedItem.market_name} ({selectedItem.wear_name || 'Factory New'})</Typography>
            </>
          ) : (
            <Typography>{t('trading.selectASkin')}</Typography>
          )}
        </Box>
        <KeyboardArrowDownIcon />
      </SelectorButton>

      <StyledPopover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: anchorEl ? anchorEl.offsetWidth : 'auto',
            mt: 1,
          }
        }}
      >
        {/* Search Input */}
        <Box sx={{ p: 2 }}>
          <SearchField
            fullWidth
            placeholder={t('trading.searchSkins')}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Category Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: 40,
          }}
          TabIndicatorProps={{
            style: { display: 'none' }
          }}
        >
          <StyledTab label={t('trading.allListings')} />
          <StyledTab label={t('trading.popular')} />
          <StyledTab label={t('trading.new')} />
        </Tabs>

        {/* Filters */}
        <Box sx={{ display: 'flex', p: 1, borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <FilterChip 
            label={t('trading.priceFilter')} 
            size="small" 
            deleteIcon={<KeyboardArrowDownIcon />}
            onDelete={() => {}}
          />
          <FilterChip 
            label={t('trading.weaponFilter')} 
            size="small" 
            deleteIcon={<KeyboardArrowDownIcon />}
            onDelete={() => {}}
          />
          <FilterChip 
            label={t('trading.exteriorFilter')} 
            size="small" 
            deleteIcon={<KeyboardArrowDownIcon />}
            onDelete={() => {}}
          />
        </Box>

        {/* Items List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ maxHeight: 256, overflow: 'auto', p: 0 }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <ListItem 
                  key={item.assetid}
                  button 
                  onClick={() => handleSelectItem(item)}
                  selected={selectedItem?.assetid === item.assetid}
                  sx={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(55, 65, 81, 0.8)',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(55, 65, 81, 0.6)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <SkinImage sx={{ mr: 1.5 }}>
                      <img 
                        src={item.icon_url} 
                        alt={item.market_name} 
                        style={{ height: '100%', width: '100%', objectFit: 'contain' }} 
                      />
                    </SkinImage>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="white">
                        {item.market_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.wear_name || t('trading.factoryNew')} | Float: {item.float_value || '0.0000'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                        {formatSolPrice(item.price || '0')} SOL
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${parseFloat(item.price || '0').toFixed(2)} USD
                      </Typography>
                      {solPrice > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          @ ${solPrice.toFixed(2)}/SOL
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('trading.noItemsFound')}
                </Typography>
              </Box>
            )}
          </List>
        )}
      </StyledPopover>
    </>
  );
};

export default ItemSelector;
