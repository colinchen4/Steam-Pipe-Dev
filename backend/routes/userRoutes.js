const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Try to import User model, but handle gracefully if database is not available
let User = null;
try {
  User = require('../models/User');
} catch (error) {
  console.warn('⚠️  User model not available - database not connected');
}

/**
 * User management routes
 * Provides user profile and data management endpoints
 */

/**
 * GET /api/user/profile
 * Get user profile by wallet address (query parameter)
 */
router.get('/profile', async (req, res) => {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    console.log(`🔍 Fetching user profile for wallet: ${wallet}`);
    
    // Check if database is available
    if (!database.isHealthy() || !User) {
      console.log('💡 Database not available, returning mock user profile');
      return res.json({
        success: true,
        user: {
          walletAddress: wallet,
          walletType: 'phantom',
          steamAccount: {
            linked: false,
            steamId: null,
            steamProfile: {},
            steamApiKey: null,
            linkedAt: null,
            lastSteamSync: null
          },
          tradingStats: {
            totalTrades: 0,
            totalVolume: 0,
            reputation: 0
          },
          preferences: {
            defaultCurrency: 'SOL',
            notifications: true,
            privacy: 'public'
          },
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        message: 'Mock profile (database not connected)'
      });
    }
    
    const user = await User.findOne({ walletAddress: wallet });
    
    if (!user) {
      // Return empty profile instead of 404 for better UX
      return res.json({
        success: true,
        user: null,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      user: {
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        steamAccount: user.steamAccount,
        tradingStats: user.tradingStats,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ User profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * POST /api/user/create
 * Create new user profile
 */
router.post('/create', async (req, res) => {
  try {
    const { walletAddress, walletType } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    // Check if database is available
    if (!database.isHealthy() || !User) {
      console.log('💡 Database not available, returning mock user creation response');
      return res.json({
        success: true,
        message: 'User creation simulated (database not connected)',
        user: {
          walletAddress,
          walletType: walletType || 'phantom',
          steamAccount: {
            linked: false,
            steamId: null,
            steamProfile: {},
            steamApiKey: null,
            linkedAt: null,
            lastSteamSync: null
          },
          tradingStats: {
            totalTrades: 0,
            totalVolume: 0,
            reputation: 0
          },
          preferences: {
            defaultCurrency: 'SOL',
            notifications: true,
            privacy: 'public'
          },
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create new user
    const user = new User({
      walletAddress,
      walletType: walletType || 'phantom',
      lastLogin: new Date(),
      steamAccount: {
        linked: false,
        steamId: null,
        steamProfile: {},
        steamApiKey: null,
        linkedAt: null,
        lastSteamSync: null
      },
      tradingStats: {
        totalTrades: 0,
        totalVolume: 0,
        reputation: 0
      },
      preferences: {
        defaultCurrency: 'SOL',
        notifications: true,
        privacy: 'public'
      }
    });
    
    await user.save();
    console.log(`✅ New user created: ${walletAddress}`);

    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        steamAccount: user.steamAccount,
        tradingStats: user.tradingStats,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ User creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/user/update
 * Update user profile
 */
router.put('/update', async (req, res) => {
  try {
    const { walletAddress, ...updateData } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user data
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        user[key] = updateData[key];
      }
    });
    
    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        steamAccount: user.steamAccount,
        tradingStats: user.tradingStats,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ User update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

module.exports = router;