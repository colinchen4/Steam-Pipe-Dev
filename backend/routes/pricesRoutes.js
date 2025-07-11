const express = require('express');
const router = express.Router();

/**
 * Prices API routes (plural) - for compatibility with frontend calls
 * Maps to the main price routes with different endpoint structure
 */

/**
 * GET /api/prices/providers
 * Get status of all price providers (alternative endpoint)
 */
router.get('/providers', async (req, res) => {
  try {
    // Mock provider status for now - return as array for frontend compatibility
    const providers = [
      { name: 'Steam Community Market', status: 'operational', latency: 150, enabled: true, available: true, lastUpdated: new Date().toISOString() },
      { name: 'Buff163', status: 'limited', latency: 300, enabled: true, available: true, lastUpdated: new Date().toISOString() },
      { name: 'C5Game', status: 'operational', latency: 200, enabled: true, available: true, lastUpdated: new Date().toISOString() },
      { name: 'Skinport', status: 'operational', latency: 100, enabled: true, available: true, lastUpdated: new Date().toISOString() },
      { name: 'ECOsteam', status: 'maintenance', latency: null, enabled: false, available: false, lastUpdated: new Date().toISOString() },
      { name: 'UUYP', status: 'operational', latency: 250, enabled: true, available: true, lastUpdated: new Date().toISOString() }
    ];
    
    res.json({
      success: true,
      data: {
        providers: providers
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Provider status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider status'
    });
  }
});

/**
 * GET /api/prices/item/:itemName
 * Get price data for a specific item (alternative endpoint)
 */
router.get('/item/:itemName', async (req, res) => {
  try {
    const { itemName } = req.params;
    
    console.log(`🔍 Fetching price data for item: ${itemName}`);
    
    // Mock price data in the format expected by frontend
    const providerData = {
      'Steam Community Market': { 
        price: 25.50, 
        marketPrice: 26.00,
        currency: 'USD', 
        available: true,
        discount: -1.92,
        accuracy: 'real-time',
        timestamp: new Date().toISOString(),
        url: 'https://steamcommunity.com/market'
      },
      'Buff163': { 
        price: 22.80, 
        marketPrice: 26.00,
        currency: 'USD', 
        available: true,
        discount: -12.31,
        accuracy: 'real-time',
        timestamp: new Date().toISOString(),
        url: 'https://buff.163.com'
      },
      'C5Game': { 
        price: 0, 
        marketPrice: 0,
        currency: 'USD', 
        available: false,
        discount: 0,
        accuracy: 'unavailable',
        timestamp: new Date().toISOString()
      },
      'Skinport': { 
        price: 24.75, 
        marketPrice: 26.00,
        currency: 'USD', 
        available: true,
        discount: -4.81,
        accuracy: 'real-time',
        timestamp: new Date().toISOString(),
        url: 'https://skinport.com'
      },
      'ECOsteam': { 
        price: 0, 
        marketPrice: 0,
        currency: 'USD', 
        available: false,
        discount: 0,
        accuracy: 'unavailable',
        timestamp: new Date().toISOString()
      },
      'UUYP': { 
        price: 23.45, 
        marketPrice: 26.00,
        currency: 'USD', 
        available: true,
        discount: -9.81,
        accuracy: 'estimated',
        timestamp: new Date().toISOString(),
        url: 'https://www.uuyp.com'
      }
    };
    
    res.json({
      success: true,
      data: {
        itemName,
        providerData: providerData,
        timestamp: Date.now(),
        bestPrice: {
          provider: 'Buff163',
          price: 22.80,
          currency: 'USD'
        }
      }
    });
  } catch (error) {
    console.error('Item price fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item price data'
    });
  }
});

module.exports = router;