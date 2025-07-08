const express = require('express');
const router = express.Router();
const User = require('../models/User');
const steamService = require('../services/steamService');
const { body, validationResult } = require('express-validator');

/**
 * Steam account management routes for SteamPipe platform
 * Handles Steam authentication, account linking, and trading operations
 */

/**
 * GET /api/steam/link
 * Initiate Steam OpenID authentication for linking to wallet
 */
router.get('/link', (req, res) => {
  const { wallet } = req.query;
  
  if (!wallet) {
    return res.status(400).json({ 
      success: false, 
      error: 'Wallet address is required' 
    });
  }
  
  // Build Steam OpenID parameters
  const returnURL = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/steam/callback`;
  const realm = process.env.BACKEND_URL || 'http://localhost:3001';
  
  const steamParams = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${returnURL}?wallet=${encodeURIComponent(wallet)}`,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
  });
  
  const steamLoginUrl = `https://steamcommunity.com/openid/login?${steamParams}`;
  
  console.log(`🔄 Initiating Steam auth for wallet: ${wallet}`);
  res.redirect(steamLoginUrl);
});

/**
 * GET /api/steam/callback
 * Handle Steam OpenID callback and link account to wallet
 */
router.get('/callback', async (req, res) => {
  try {
    const { wallet } = req.query;
    
    if (!wallet) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=missing_wallet`);
    }
    
    // Verify OpenID response
    const verification = await steamService.verifyOpenIdResponse(req.query);
    
    if (!verification.valid) {
      console.error('❌ Steam OpenID verification failed');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=invalid_steam_auth`);
    }
    
    const { steamId } = verification;
    console.log(`✅ Steam authentication successful for Steam ID: ${steamId}`);
    
    // Get Steam profile
    const steamProfile = await steamService.getUserProfile(steamId);
    
    // Get trade status
    const tradeStatus = await steamService.getTradeStatus(steamId);
    
    // Check if user already exists
    let user = await User.findByWalletAddress(wallet);
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=user_not_found`);
    }
    
    // Update user with Steam data
    user.steamAccount.linked = true;
    user.steamAccount.steamId = steamId;
    user.steamAccount.steamProfile = steamProfile;
    user.steamAccount.linkedAt = new Date();
    user.steamAccount.lastSteamSync = new Date();
    user.steamTradeStatus = tradeStatus;
    user.steamLoginConsent = true;
    
    await user.save();
    
    console.log(`✅ Linked Steam account ${steamId} to wallet ${wallet}`);
    
    // Check if Steam account is already linked to another wallet
    const existingSteamUser = await User.findBySteamId(steamId);
    if (existingSteamUser && existingSteamUser.walletAddress !== wallet) {
      console.warn(`⚠️  Steam ID ${steamId} already linked to another wallet: ${existingSteamUser.walletAddress}`);
    }
    
    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?steam_auth=success&steam_id=${steamId}`);
    
  } catch (error) {
    console.error('❌ Steam auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=steam_auth_failed`);
  }
});

/**
 * GET /api/steam/account/:walletAddress
 * Get Steam account information for a wallet
 */
router.get('/account/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (!user.steamId) {
      return res.status(404).json({
        success: false,
        error: 'No Steam account linked'
      });
    }
    
    res.json({
      success: true,
      data: {
        steamId: user.steamId,
        steamProfile: user.steamProfile,
        steamTradeStatus: user.steamTradeStatus,
        steamInventoryStatus: user.steamInventoryStatus,
        isTradeEligible: user.isTradeEligible,
        tradingStats: user.tradingStats,
        lastUpdated: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching Steam account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/steam/account/link
 * Link Steam account to wallet (alternative to OpenID)
 */
router.post('/account/link', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required'),
  body('steamId').matches(/^7656119\d{10}$/).withMessage('Invalid Steam ID format'),
  body('steamApiKey').optional().isLength({ min: 32, max: 32 }).withMessage('Invalid Steam API key format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { walletAddress, steamId, steamApiKey } = req.body;
    
    // Verify Steam ID exists and get profile
    const steamProfile = await steamService.getUserProfile(steamId);
    const tradeStatus = await steamService.getTradeStatus(steamId);
    
    // Check if Steam ID is already linked to another wallet
    const existingUser = await User.findBySteamId(steamId);
    if (existingUser && existingUser.phantomWalletAddress !== walletAddress) {
      return res.status(409).json({
        success: false,
        error: 'Steam account is already linked to another wallet'
      });
    }
    
    // Find or create user
    let user = await User.findByWalletAddress(walletAddress);
    
    if (user) {
      user.steamId = steamId;
      user.steamProfile = steamProfile;
      user.steamTradeStatus = tradeStatus;
      user.steamLoginConsent = true;
      if (steamApiKey) {
        user.steamApiKey = steamApiKey;
      }
      await user.save();
    } else {
      user = new User({
        phantomWalletAddress: walletAddress,
        steamId,
        steamProfile,
        steamTradeStatus: tradeStatus,
        steamLoginConsent: true,
        steamApiKey: steamApiKey || undefined,
        permissions: {
          canTrade: tradeStatus.canTrade,
          isVerified: false
        }
      });
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Steam account linked successfully',
      data: {
        steamId: user.steamId,
        steamProfile: user.steamProfile,
        isTradeEligible: user.isTradeEligible
      }
    });
    
  } catch (error) {
    console.error('❌ Error linking Steam account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/steam/account/unlink
 * Unlink Steam account from wallet
 */
router.delete('/account/unlink', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { walletAddress } = req.body;
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Clear Steam data
    user.steamId = undefined;
    user.steamProfile = {};
    user.steamTradeStatus = {
      status: 'Unknown',
      canTrade: false,
      lastChecked: new Date()
    };
    user.steamInventoryStatus = {
      isPublic: false,
      lastInventoryCheck: null
    };
    user.steamApiKey = undefined;
    user.steamTradeUrl = undefined;
    user.steamLoginConsent = false;
    user.permissions.canTrade = false;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Steam account unlinked successfully'
    });
    
  } catch (error) {
    console.error('❌ Error unlinking Steam account:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/steam/inventory/:walletAddress
 * Get Steam inventory for a user
 */
router.get('/inventory/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { refresh } = req.query;
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user || !user.steamId) {
      return res.status(404).json({
        success: false,
        error: 'No Steam account linked'
      });
    }
    
    // Check if we need to refresh or if cached data is recent
    const shouldRefresh = refresh === 'true' || 
      !user.steamInventoryStatus.lastInventoryCheck ||
      Date.now() - user.steamInventoryStatus.lastInventoryCheck.getTime() > 5 * 60 * 1000; // 5 minutes
    
    if (shouldRefresh) {
      try {
        const inventory = await steamService.getUserInventory(user.steamId);
        
        // Update user's inventory status
        user.steamInventoryStatus.lastInventoryCheck = new Date();
        user.steamInventoryStatus.inventoryItemCount = inventory.total;
        user.steamInventoryStatus.lastInventoryUpdate = new Date();
        await user.save();
        
        res.json({
          success: true,
          data: inventory,
          cached: false
        });
      } catch (error) {
        if (error.message.includes('private')) {
          user.steamInventoryStatus.isPublic = false;
          await user.save();
        }
        
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    } else {
      // Return cached status
      res.json({
        success: true,
        data: {
          items: [],
          total: user.steamInventoryStatus.inventoryItemCount,
          lastUpdated: user.steamInventoryStatus.lastInventoryUpdate,
          message: 'Use refresh=true to fetch latest inventory'
        },
        cached: true
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching Steam inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/steam/trade/send
 * Send a trade offer
 */
router.post('/trade/send', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required'),
  body('partnerSteamId').matches(/^7656119\d{10}$/).withMessage('Invalid partner Steam ID'),
  body('tradeToken').notEmpty().withMessage('Trade token is required'),
  body('itemsToGive').isArray().withMessage('Items to give must be an array'),
  body('itemsToReceive').isArray().withMessage('Items to receive must be an array'),
  body('message').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { walletAddress, partnerSteamId, tradeToken, itemsToGive, itemsToReceive, message } = req.body;
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user || !user.steamId) {
      return res.status(404).json({
        success: false,
        error: 'No Steam account linked'
      });
    }
    
    if (!user.isTradeEligible) {
      return res.status(403).json({
        success: false,
        error: 'User is not eligible for trading'
      });
    }
    
    // Send trade offer
    const tradeOffer = await steamService.sendTradeOffer(
      partnerSteamId,
      tradeToken,
      itemsToGive,
      itemsToReceive,
      message || ''
    );
    
    // Log transaction
    await user.addTransaction({
      transactionId: tradeOffer.tradeOfferId,
      type: 'trade',
      amount: 0, // This would be calculated based on item values
      currency: 'USD',
      status: 'pending'
    });
    
    res.json({
      success: true,
      data: tradeOffer
    });
    
  } catch (error) {
    console.error('❌ Error sending trade offer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/steam/trade/:tradeOfferId
 * Get trade offer status
 */
router.get('/trade/:tradeOfferId', async (req, res) => {
  try {
    const { tradeOfferId } = req.params;
    
    const tradeOffer = await steamService.getTradeOffer(tradeOfferId);
    
    res.json({
      success: true,
      data: tradeOffer
    });
    
  } catch (error) {
    console.error('❌ Error fetching trade offer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/steam/trades/:walletAddress
 * Get user's trade offers
 */
router.get('/trades/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { active_only } = req.query;
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user || !user.steamId) {
      return res.status(404).json({
        success: false,
        error: 'No Steam account linked'
      });
    }
    
    const tradeOffers = await steamService.getTradeOffers(user.steamId, active_only !== 'false');
    
    res.json({
      success: true,
      data: tradeOffers
    });
    
  } catch (error) {
    console.error('❌ Error fetching trade offers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/steam/profile/update
 * Update cached Steam profile data
 */
router.post('/profile/update', [
  body('walletAddress').notEmpty().withMessage('Wallet address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { walletAddress } = req.body;
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user || !user.steamId) {
      return res.status(404).json({
        success: false,
        error: 'No Steam account linked'
      });
    }
    
    // Fetch fresh data from Steam
    const [steamProfile, tradeStatus] = await Promise.all([
      steamService.getUserProfile(user.steamId),
      steamService.getTradeStatus(user.steamId)
    ]);
    
    // Update user data
    await user.updateSteamProfile(steamProfile);
    await user.updateTradeStatus(tradeStatus);
    
    res.json({
      success: true,
      message: 'Steam profile updated successfully',
      data: {
        steamProfile: user.steamProfile,
        steamTradeStatus: user.steamTradeStatus,
        isTradeEligible: user.isTradeEligible
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating Steam profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/steam/status
 * Get Steam service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await steamService.getServiceStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ Error checking Steam service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Steam service status'
    });
  }
});

module.exports = router;