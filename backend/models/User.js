const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * User model for SteamPipe platform
 * Links Phantom wallet addresses to Steam accounts with trading capabilities
 */
const userSchema = new mongoose.Schema({
  // Primary identifiers (wallet-first approach)
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        // Basic Solana address validation (base58, 32-44 characters)
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
      },
      message: 'Invalid Solana wallet address format'
    }
  },

  // Wallet type (phantom, okex, solflare, backpack, coinbase)
  walletType: {
    type: String,
    required: true,
    enum: ['phantom', 'okex', 'solflare', 'backpack', 'coinbase'],
    default: 'phantom'
  },

  // Steam integration (optional)
  steamAccount: {
    linked: {
      type: Boolean,
      default: false
    },
    steamId: {
      type: String,
      index: true,
      validate: {
        validator: function(v) {
          // Steam ID64 validation (17 digits starting with 7656119)
          return !v || /^7656119\d{10}$/.test(v);
        },
        message: 'Invalid Steam ID64 format'
      }
    },
    steamProfile: {
      personaname: String,      // Display name
      profileurl: String,       // Steam profile URL
      avatar: String,           // Avatar image URL
      avatarmedium: String,     // Medium avatar
      avatarfull: String,       // Full size avatar
      personastate: Number,     // Online status
      communityvisibilitystate: Number, // Profile visibility
      profilestate: Number,     // Profile completeness
      lastlogoff: Date,         // Last seen
      countrycode: String,      // Country
      statecode: String,        // State/province
      cityid: Number,           // City ID
      locstatecode: String,     // Location state
      loccountrycode: String    // Location country
    },
    steamApiKey: {
      type: String,
      set: function(apiKey) {
        if (!apiKey) return apiKey;
        // Encrypt Steam API key for security
        return this.encrypt(apiKey);
      },
      get: function(encryptedKey) {
        if (!encryptedKey) return encryptedKey;
        // Decrypt Steam API key when accessed
        return this.decrypt(encryptedKey);
      }
    },
    linkedAt: Date,
    lastSteamSync: Date
  },


  // Steam trading configuration
  steamTradeUrl: {
    type: String,
    validate: {
      validator: function(v) {
        // Steam trade URL validation
        return !v || /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/.test(v);
      },
      message: 'Invalid Steam trade URL format'
    }
  },

  // Trading status and restrictions
  steamTradeStatus: {
    status: {
      type: String,
      enum: ['Normal', 'Restricted', 'Banned', 'Unknown'],
      default: 'Unknown'
    },
    canTrade: {
      type: Boolean,
      default: false
    },
    tradeRestrictions: {
      escrowDays: {
        type: Number,
        default: 0
      },
      probationDays: {
        type: Number,
        default: 0
      }
    },
    lastChecked: {
      type: Date,
      default: Date.now
    }
  },

  // Steam inventory settings
  steamInventoryStatus: {
    isPublic: {
      type: Boolean,
      default: false
    },
    lastInventoryCheck: Date,
    inventoryItemCount: {
      type: Number,
      default: 0
    },
    lastInventoryUpdate: Date
  },

  // Platform permissions and settings
  permissions: {
    canTrade: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    kycCompleted: {
      type: Boolean,
      default: false
    }
  },

  // Trading history tracking
  tradingStats: {
    totalTrades: {
      type: Number,
      default: 0
    },
    successfulTrades: {
      type: Number,
      default: 0
    },
    totalVolumeUSD: {
      type: Number,
      default: 0
    },
    totalVolumeSOL: {
      type: Number,
      default: 0
    },
    averageTradeValue: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Consent and legal
  steamLoginConsent: {
    type: Boolean,
    default: false
  },
  privacyPolicyAccepted: {
    type: Boolean,
    default: false
  },
  termsOfServiceAccepted: {
    type: Boolean,
    default: false
  },

  // Security and authentication
  lastLogin: Date,
  lastIpAddress: String,
  sessionTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    deviceInfo: String
  }],

  // Platform-specific data
  solanaTransactions: [{
    transactionId: String,
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'trade', 'escrow']
    },
    amount: Number,
    currency: {
      type: String,
      enum: ['SOL', 'USDC']
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive data from JSON output
      delete ret.steamApiKey;
      delete ret.sessionTokens;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ walletAddress: 1 }, { unique: true });
userSchema.index({ walletType: 1 });
userSchema.index({ 'steamAccount.steamId': 1 });
userSchema.index({ 'steamAccount.linked': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'steamTradeStatus.status': 1 });
userSchema.index({ 'permissions.canTrade': 1 });

// Encryption methods for sensitive data
userSchema.methods.encrypt = function(text) {
  if (!text) return text;
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

userSchema.methods.decrypt = function(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'object') return encryptedData;
  
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Virtual for full Steam profile URL
userSchema.virtual('steamProfileUrl').get(function() {
  return this.steamId ? `https://steamcommunity.com/profiles/${this.steamId}` : null;
});

// Virtual for trade eligibility
userSchema.virtual('isTradeEligible').get(function() {
  return this.permissions.canTrade && 
         this.steamTradeStatus.canTrade && 
         this.steamInventoryStatus.isPublic &&
         this.steamLoginConsent;
});

// Instance methods
userSchema.methods.updateSteamProfile = async function(profileData) {
  this.steamProfile = {
    ...this.steamProfile,
    ...profileData,
    lastUpdated: new Date()
  };
  this.updatedAt = new Date();
  return this.save();
};

userSchema.methods.updateTradeStatus = async function(tradeStatus) {
  this.steamTradeStatus = {
    ...this.steamTradeStatus,
    ...tradeStatus,
    lastChecked: new Date()
  };
  return this.save();
};

userSchema.methods.addTransaction = async function(transactionData) {
  this.solanaTransactions.push({
    ...transactionData,
    createdAt: new Date()
  });
  
  // Update trading stats
  if (transactionData.type === 'trade' && transactionData.status === 'confirmed') {
    this.tradingStats.totalTrades += 1;
    this.tradingStats.successfulTrades += 1;
    
    if (transactionData.currency === 'USD') {
      this.tradingStats.totalVolumeUSD += transactionData.amount;
    } else if (transactionData.currency === 'SOL') {
      this.tradingStats.totalVolumeSOL += transactionData.amount;
    }
    
    // Recalculate average trade value
    this.tradingStats.averageTradeValue = this.tradingStats.totalVolumeUSD / this.tradingStats.totalTrades;
  }
  
  return this.save();
};

// Static methods
userSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ walletAddress });
};

userSchema.statics.findBySteamId = function(steamId) {
  return this.findOne({ 'steamAccount.steamId': steamId });
};

userSchema.statics.findTradeEligibleUsers = function() {
  return this.find({
    'permissions.canTrade': true,
    'steamTradeStatus.canTrade': true,
    'steamInventoryStatus.isPublic': true,
    steamLoginConsent: true,
    isActive: true
  });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-find middleware to exclude inactive users by default
userSchema.pre(/^find/, function(next) {
  if (!this.getQuery().isActive) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);