const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const crypto = require('crypto');
const bs58 = require('bs58');
const nacl = require('tweetnacl');

/**
 * Wallet-First Authentication Routes
 * Supports multiple Solana wallets: Phantom, OKEx, Solflare, Backpack, etc.
 */

/**
 * POST /api/auth/wallet
 * Primary authentication via wallet signature
 */
router.post('/wallet', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required'),
  body('walletType').isIn(['phantom', 'okex', 'solflare', 'backpack', 'coinbase']).withMessage('Invalid wallet type'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { walletAddress, walletType, signature, message } = req.body;

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid wallet signature'
      });
    }

    // Find or create user
    let user = await User.findOne({ walletAddress });
    
    if (user) {
      // Update existing user
      user.walletType = walletType;
      user.lastLogin = new Date();
      await user.save();
      
      console.log(`✅ User logged in: ${walletAddress} (${walletType})`);
    } else {
      // Create new user
      user = new User({
        walletAddress,
        walletType,
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
      console.log(`✅ New user created: ${walletAddress} (${walletType})`);
    }

    // Generate session token
    const sessionToken = generateSessionToken(walletAddress);
    
    // Store session
    req.session.userId = user._id;
    req.session.walletAddress = walletAddress;
    req.session.sessionToken = sessionToken;

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        steamAccount: user.steamAccount,
        tradingStats: user.tradingStats,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      sessionToken
    });

  } catch (error) {
    console.error('❌ Wallet authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and clear session
 */
router.post('/logout', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required')
], async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    console.log(`👋 User logged out: ${walletAddress}`);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/auth/profile/:walletAddress
 * Get user profile data
 */
router.get('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
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
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * PUT /api/auth/preferences
 * Update user preferences
 */
router.put('/preferences', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required'),
  body('preferences').isObject().withMessage('Preferences must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { walletAddress, preferences } = req.body;
    
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update preferences
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('❌ Preferences update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * GET /api/auth/session
 * Verify current session
 */
router.get('/session', (req, res) => {
  if (req.session && req.session.walletAddress) {
    res.json({
      success: true,
      authenticated: true,
      walletAddress: req.session.walletAddress,
      sessionToken: req.session.sessionToken
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

/**
 * GET /api/auth/supported-wallets
 * Get list of supported wallet types
 */
router.get('/supported-wallets', (req, res) => {
  const supportedWallets = [
    {
      type: 'phantom',
      name: 'Phantom',
      icon: '/icons/phantom.svg',
      website: 'https://phantom.app',
      description: 'The most popular Solana wallet'
    },
    {
      type: 'okex',
      name: 'OKEx Wallet',
      icon: '/icons/okex.svg',
      website: 'https://www.okx.com/web3',
      description: 'Multi-chain wallet by OKX'
    },
    {
      type: 'solflare',
      name: 'Solflare',
      icon: '/icons/solflare.svg',
      website: 'https://solflare.com',
      description: 'Secure Solana wallet'
    },
    {
      type: 'backpack',
      name: 'Backpack',
      icon: '/icons/backpack.svg',
      website: 'https://backpack.app',
      description: 'Modern crypto wallet'
    },
    {
      type: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '/icons/coinbase.svg',
      website: 'https://wallet.coinbase.com',
      description: 'Self-custody wallet by Coinbase'
    }
  ];

  res.json({
    success: true,
    wallets: supportedWallets
  });
});

/**
 * Helper function to verify wallet signature
 */
async function verifyWalletSignature(walletAddress, signature, message) {
  try {
    // Convert signature from base58 to Uint8Array
    const signatureBytes = bs58.decode(signature);
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);
    
    // Convert wallet address to public key bytes
    const publicKeyBytes = bs58.decode(walletAddress);
    
    // Verify signature using nacl
    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
    
    return verified;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Helper function to generate session token
 */
function generateSessionToken(walletAddress) {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const data = `${walletAddress}-${timestamp}-${randomBytes}`;
  
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = router;