const axios = require('axios');
const crypto = require('crypto');

/**
 * Comprehensive Steam API service for SteamPipe platform
 * Handles Steam Web API integration, inventory management, and trading
 */
class SteamService {
  constructor() {
    this.baseUrl = 'https://api.steampowered.com';
    this.communityUrl = 'https://steamcommunity.com';
    
    // Rate limiting configuration per user API key
    this.rateLimiters = new Map(); // Track rate limits per user API key
    
    console.log('🎮 Steam service initialized (user-provided API keys)');
  }

  /**
   * Check rate limit before making API calls for a specific user API key
   */
  checkRateLimit(userApiKey) {
    if (!userApiKey) return; // Skip rate limiting for non-API calls
    
    const now = Date.now();
    
    if (!this.rateLimiters.has(userApiKey)) {
      this.rateLimiters.set(userApiKey, {
        requests: 0,
        resetTime: now + 24 * 60 * 60 * 1000, // 24 hours
        maxRequests: 100000 // Steam API allows 100,000 requests per day per key
      });
    }
    
    const limiter = this.rateLimiters.get(userApiKey);
    
    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + 24 * 60 * 60 * 1000;
    }
    
    if (limiter.requests >= limiter.maxRequests) {
      throw new Error('Steam API rate limit exceeded for this user. Please try again later.');
    }
    
    limiter.requests++;
  }

  /**
   * Make authenticated Steam API request using user's API key
   */
  async makeApiRequest(endpoint, params = {}, userApiKey = null) {
    if (!userApiKey) {
      throw new Error('User Steam API key required for this operation');
    }
    
    this.checkRateLimit(userApiKey);
    
    const url = `${this.baseUrl}${endpoint}`;
    const requestParams = {
      key: userApiKey,
      format: 'json',
      ...params
    };
    
    try {
      console.log(`🔄 Steam API Request: ${endpoint}`);
      const response = await axios.get(url, { 
        params: requestParams,
        timeout: 10000 // 10 second timeout
      });
      
      console.log(`✅ Steam API Response: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Steam API Error (${endpoint}):`, error.message);
      
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Invalid Steam API key');
        } else if (status === 403) {
          throw new Error('Steam API access forbidden');
        } else if (status === 429) {
          throw new Error('Steam API rate limit exceeded');
        } else if (status === 500) {
          throw new Error('Steam API server error');
        }
      }
      
      throw new Error(`Steam API request failed: ${error.message}`);
    }
  }

  /**
   * Get user profile information from Steam
   * NOTE: This can work without API key for basic info, but requires API key for detailed info
   */
  async getUserProfile(steamId, userApiKey = null) {
    try {
      const response = await this.makeApiRequest('/ISteamUser/GetPlayerSummaries/v0002/', {
        steamids: steamId
      }, userApiKey);
      
      const players = response.response?.players;
      if (!players || players.length === 0) {
        throw new Error('Steam profile not found');
      }
      
      const profile = players[0];
      
      // Convert timestamps to dates
      if (profile.lastlogoff) {
        profile.lastlogoff = new Date(profile.lastlogoff * 1000);
      }
      if (profile.timecreated) {
        profile.timecreated = new Date(profile.timecreated * 1000);
      }
      
      console.log(`✅ Retrieved Steam profile for ${profile.personaname}`);
      return profile;
    } catch (error) {
      console.error(`❌ Failed to get Steam profile for ${steamId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get user's CS:GO inventory
   */
  async getUserInventory(steamId, appId = 730) { // 730 = CS:GO/CS2
    try {
      // First check if inventory is public
      const isPublic = await this.isInventoryPublic(steamId);
      if (!isPublic) {
        throw new Error('Steam inventory is private');
      }
      
      const response = await this.makeApiRequest('/IEconService/GetInventory/v1/', {
        steamid: steamId,
        appid: appId,
        contextid: 2, // CS:GO context
        count: 5000 // Maximum items to fetch
      });
      
      const inventory = response.response;
      if (!inventory || !inventory.assets) {
        return { items: [], total: 0 };
      }
      
      // Combine assets with descriptions
      const items = inventory.assets.map(asset => {
        const description = inventory.descriptions?.find(desc => 
          desc.classid === asset.classid && desc.instanceid === asset.instanceid
        );
        
        return {
          assetid: asset.assetid,
          classid: asset.classid,
          instanceid: asset.instanceid,
          amount: asset.amount,
          pos: asset.pos,
          id: `${asset.classid}_${asset.instanceid}_${asset.assetid}`,
          name: description?.name || 'Unknown Item',
          market_name: description?.market_name || description?.name || 'Unknown Item',
          market_hash_name: description?.market_hash_name || description?.market_name || description?.name,
          icon_url: description?.icon_url ? `https://steamcommunity-a.akamaihd.net/economy/image/${description.icon_url}` : null,
          tradable: description?.tradable === 1,
          marketable: description?.marketable === 1,
          commodity: description?.commodity === 1,
          type: description?.type || 'Unknown',
          rarity: this.extractRarity(description?.tags),
          wear: this.extractWear(description?.tags),
          exterior: this.extractExterior(description?.tags),
          quality: this.extractQuality(description?.tags),
          tags: description?.tags || []
        };
      });
      
      console.log(`✅ Retrieved ${items.length} items from Steam inventory`);
      return {
        items,
        total: items.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`❌ Failed to get Steam inventory for ${steamId}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if user's inventory is public
   */
  async isInventoryPublic(steamId) {
    try {
      const profile = await this.getUserProfile(steamId);
      
      // Check community visibility state
      // 3 = Public, 1 = Private
      const isProfilePublic = profile.communityvisibilitystate === 3;
      
      if (!isProfilePublic) {
        return false;
      }
      
      // Additional check by attempting to access inventory directly
      try {
        const inventoryUrl = `${this.communityUrl}/inventory/${steamId}/730/2`;
        const response = await axios.get(inventoryUrl, { 
          timeout: 5000,
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        });
        
        return response.status === 200;
      } catch (error) {
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to check inventory visibility for ${steamId}:`, error.message);
      return false;
    }
  }

  /**
   * Get user's trade status and restrictions
   */
  async getTradeStatus(steamId) {
    try {
      const profile = await this.getUserProfile(steamId);
      
      // Default trade status
      let tradeStatus = {
        canTrade: false,
        status: 'Unknown',
        restrictions: {
          escrowDays: 0,
          probationDays: 0
        }
      };
      
      // Check basic profile requirements
      if (profile.communityvisibilitystate !== 3) {
        tradeStatus.status = 'Private Profile';
        return tradeStatus;
      }
      
      // Check if profile is limited
      if (profile.profilestate !== 1) {
        tradeStatus.status = 'Limited Account';
        return tradeStatus;
      }
      
      // Additional trade restriction checks would go here
      // (requires Steam's trade restriction API access)
      
      tradeStatus.canTrade = true;
      tradeStatus.status = 'Normal';
      
      console.log(`✅ Trade status for ${steamId}: ${tradeStatus.status}`);
      return tradeStatus;
    } catch (error) {
      console.error(`❌ Failed to get trade status for ${steamId}:`, error.message);
      return {
        canTrade: false,
        status: 'Error',
        restrictions: { escrowDays: 0, probationDays: 0 }
      };
    }
  }

  /**
   * Send trade offer to user
   */
  async sendTradeOffer(partnerSteamId, tradeToken, itemsToGive = [], itemsToReceive = [], message = '') {
    try {
      const tradeOfferData = {
        newversion: true,
        version: 4,
        me: {
          assets: itemsToGive.map(item => ({
            appid: 730,
            contextid: '2',
            amount: 1,
            assetid: item.assetid
          })),
          currency: [],
          ready: false
        },
        them: {
          assets: itemsToReceive.map(item => ({
            appid: 730,
            contextid: '2',
            amount: 1,
            assetid: item.assetid
          })),
          currency: [],
          ready: false
        }
      };
      
      const response = await this.makeApiRequest('/IEconService/SendTradeOffer/v1/', {
        trade_offer_access_token: tradeToken,
        json_tradeoffer: JSON.stringify(tradeOfferData),
        trade_offer_message: message
      });
      
      const tradeOfferId = response.response?.tradeofferid;
      if (!tradeOfferId) {
        throw new Error('Failed to create trade offer');
      }
      
      console.log(`✅ Trade offer sent: ${tradeOfferId}`);
      return {
        tradeOfferId,
        status: 'sent',
        createdAt: new Date()
      };
    } catch (error) {
      console.error(`❌ Failed to send trade offer:`, error.message);
      throw error;
    }
  }

  /**
   * Get trade offer details
   */
  async getTradeOffer(tradeOfferId) {
    try {
      const response = await this.makeApiRequest('/IEconService/GetTradeOffer/v1/', {
        tradeofferid: tradeOfferId,
        language: 'english'
      });
      
      const offer = response.response?.offer;
      if (!offer) {
        throw new Error('Trade offer not found');
      }
      
      // Map trade offer states
      const stateMap = {
        1: 'Invalid',
        2: 'Active',
        3: 'Accepted',
        4: 'Countered',
        5: 'Expired',
        6: 'Canceled',
        7: 'Declined',
        8: 'InvalidItems',
        9: 'CreatedNeedsConfirmation',
        10: 'CanceledBySecondFactor',
        11: 'InEscrow'
      };
      
      return {
        tradeOfferId: offer.tradeofferid,
        state: stateMap[offer.trade_offer_state] || 'Unknown',
        stateCode: offer.trade_offer_state,
        message: offer.message || '',
        expirationTime: offer.expiration_time ? new Date(offer.expiration_time * 1000) : null,
        timeCreated: new Date(offer.time_created * 1000),
        timeUpdated: offer.time_updated ? new Date(offer.time_updated * 1000) : null,
        fromRealTimeTrade: offer.from_real_time_trade,
        escrowEndDate: offer.escrow_end_date ? new Date(offer.escrow_end_date * 1000) : null,
        itemsToGive: offer.items_to_give || [],
        itemsToReceive: offer.items_to_receive || []
      };
    } catch (error) {
      console.error(`❌ Failed to get trade offer ${tradeOfferId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get user's trade offers
   */
  async getTradeOffers(steamId, activeOnly = true) {
    try {
      const response = await this.makeApiRequest('/IEconService/GetTradeOffers/v1/', {
        get_sent_offers: 1,
        get_received_offers: 1,
        get_descriptions: 1,
        active_only: activeOnly ? 1 : 0,
        historical_only: activeOnly ? 0 : 1,
        time_historical_cutoff: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60) // 30 days ago
      });
      
      const result = response.response || {};
      
      return {
        sent: result.trade_offers_sent || [],
        received: result.trade_offers_received || [],
        descriptions: result.descriptions || []
      };
    } catch (error) {
      console.error(`❌ Failed to get trade offers for ${steamId}:`, error.message);
      throw error;
    }
  }

  /**
   * Verify Steam OpenID authentication response
   */
  async verifyOpenIdResponse(params) {
    try {
      // Build verification parameters
      const verifyParams = { ...params };
      verifyParams['openid.mode'] = 'check_authentication';
      
      const response = await axios.post('https://steamcommunity.com/openid/login', 
        new URLSearchParams(verifyParams), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000
        }
      );
      
      const isValid = response.data.includes('is_valid:true');
      
      if (isValid) {
        // Extract Steam ID from claimed_id
        const claimedId = params['openid.claimed_id'];
        const steamId = claimedId.replace('https://steamcommunity.com/openid/id/', '');
        
        return {
          valid: true,
          steamId,
          identity: claimedId
        };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('❌ OpenID verification failed:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Helper method to extract item rarity from tags
   */
  extractRarity(tags) {
    if (!tags) return 'Unknown';
    
    const rarityTag = tags.find(tag => tag.category === 'Rarity');
    return rarityTag ? rarityTag.localized_tag_name : 'Unknown';
  }

  /**
   * Helper method to extract item wear from tags
   */
  extractWear(tags) {
    if (!tags) return null;
    
    const wearTag = tags.find(tag => tag.category === 'Exterior');
    return wearTag ? wearTag.localized_tag_name : null;
  }

  /**
   * Helper method to extract item exterior from tags
   */
  extractExterior(tags) {
    if (!tags) return null;
    
    const exteriorTag = tags.find(tag => tag.category === 'Exterior');
    return exteriorTag ? exteriorTag.internal_name : null;
  }

  /**
   * Helper method to extract item quality from tags
   */
  extractQuality(tags) {
    if (!tags) return 'Unknown';
    
    const qualityTag = tags.find(tag => tag.category === 'Quality');
    return qualityTag ? qualityTag.localized_tag_name : 'Unknown';
  }

  /**
   * Get Steam service status
   */
  async getServiceStatus() {
    try {
      // Check if we can make a basic API call
      await this.makeApiRequest('/ISteamUser/GetPlayerSummaries/v0002/', {
        steamids: '76561198000000000' // Test with a known Steam ID format
      });
      
      return {
        status: 'operational',
        apiKey: !!this.steamApiKey,
        rateLimit: {
          requests: this.rateLimiter.requests,
          remaining: this.rateLimiter.maxRequests - this.rateLimiter.requests,
          resetTime: new Date(this.rateLimiter.resetTime)
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        apiKey: !!this.steamApiKey
      };
    }
  }
}

module.exports = new SteamService();