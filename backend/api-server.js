require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const Redis = require('redis');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Initialize backend keypair (for demo purposes)
let backendKeypair;
try {
    if (process.env.BACKEND_PRIVATE_KEY) {
        const privateKeyArray = JSON.parse(process.env.BACKEND_PRIVATE_KEY);
        backendKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } else {
        // Generate a new keypair for demo
        backendKeypair = Keypair.generate();
        console.log('Generated new backend keypair:', backendKeypair.publicKey.toString());
    }
} catch (error) {
    console.log('Using generated keypair for demo');
    backendKeypair = Keypair.generate();
}

// In-memory storage for active trades (use database in production)
const activeTrades = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Verify Steam item ownership
 * Called when a seller creates a listing
 */
app.post('/api/verify-item', async (req, res) => {
    try {
        const { steamId, itemId } = req.body;

        if (!steamId || !itemId) {
            return res.status(400).json({ 
                error: 'Missing required fields: steamId, itemId' 
            });
        }

        const hasItem = await steamTradeManager.verifyItemOwnership(steamId, itemId);

        res.json({
            verified: hasItem,
            steamId,
            itemId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error verifying item:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * Initiate trade process
 * Called after buyer locks funds in escrow on Solana
 */
app.post('/api/initiate-trade', async (req, res) => {
    try {
        const {
            tradeId,
            escrowAccount,
            sellerSteamId,
            buyerSteamId,
            buyerTradeToken,
            itemId,
            itemAssetId,
            amount
        } = req.body;

        // Validate required fields
        const requiredFields = [
            'tradeId', 'escrowAccount', 'sellerSteamId', 
            'buyerSteamId', 'itemId', 'itemAssetId'
        ];
        
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ 
                    error: `Missing required field: ${field}` 
                });
            }
        }

        // Store trade data
        const tradeData = {
            tradeId,
            escrowAccount,
            sellerSteamId,
            buyerSteamId,
            buyerTradeToken,
            itemId,
            itemAssetId,
            amount,
            status: 'initiated',
            createdAt: new Date().toISOString()
        };

        activeTrades.set(tradeId.toString(), tradeData);

        // Start trade flow asynchronously
        steamTradeManager.handleTradeFlow(tradeData)
            .then(success => {
                if (success) {
                    tradeData.status = 'processing';
                } else {
                    tradeData.status = 'failed';
                }
                activeTrades.set(tradeId.toString(), tradeData);
            })
            .catch(error => {
                console.error(`Trade flow error for ${tradeId}:`, error);
                tradeData.status = 'error';
                tradeData.error = error.message;
                activeTrades.set(tradeId.toString(), tradeData);
            });

        res.json({
            success: true,
            tradeId,
            status: 'initiated',
            message: 'Trade process started'
        });

    } catch (error) {
        console.error('Error initiating trade:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * Get trade status
 */
app.get('/api/trade/:tradeId', (req, res) => {
    try {
        const { tradeId } = req.params;
        const tradeData = activeTrades.get(tradeId);

        if (!tradeData) {
            return res.status(404).json({ 
                error: 'Trade not found' 
            });
        }

        res.json(tradeData);

    } catch (error) {
        console.error('Error getting trade status:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * Get all active trades (admin endpoint)
 */
app.get('/api/admin/trades', (req, res) => {
    try {
        // In production, add authentication here
        const trades = Array.from(activeTrades.values());
        res.json({
            count: trades.length,
            trades
        });

    } catch (error) {
        console.error('Error getting trades:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * Manual trade verification (admin endpoint)
 * For testing or manual intervention
 */
app.post('/api/admin/verify-trade', async (req, res) => {
    try {
        const { tradeId, escrowAccount, sellerSteamId, itemId } = req.body;

        if (!tradeId || !escrowAccount || !sellerSteamId || !itemId) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        const verified = await steamTradeManager.verifyAndUpdateContract(
            parseInt(tradeId),
            sellerSteamId,
            itemId,
            new PublicKey(escrowAccount)
        );

        res.json({
            success: verified,
            tradeId,
            message: verified ? 'Trade verified successfully' : 'Trade verification failed'
        });

    } catch (error) {
        console.error('Error in manual verification:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * Manual trade completion (admin endpoint)
 */
app.post('/api/admin/complete-trade', async (req, res) => {
    try {
        const { tradeId, escrowAccount, steamTradeUrl } = req.body;

        if (!tradeId || !escrowAccount) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        const tx = await steamTradeManager.confirmSteamTransferOnChain(
            parseInt(tradeId),
            new PublicKey(escrowAccount),
            steamTradeUrl || `Manual completion for trade ${tradeId}`
        );

        res.json({
            success: true,
            tradeId,
            transactionId: tx,
            message: 'Trade completed successfully'
        });

    } catch (error) {
        console.error('Error in manual completion:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * Get Steam inventory for a user
 */
app.get('/api/steam/inventory/:steamId', async (req, res) => {
    try {
        const { steamId } = req.params;
        
        // This would call Steam API to get inventory
        // Simplified version - you'd want to implement proper inventory fetching
        const url = `https://api.steampowered.com/IEconService/GetInventory/v1/`;
        const params = {
            key: process.env.STEAM_API_KEY,
            steamid: steamId,
            appid: 730,
            contextid: 2,
            count: 100
        };

        const response = await axios.get(url, { params });
        
        res.json({
            steamId,
            inventory: response.data.response || {},
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching Steam inventory:', error);
        res.status(500).json({ 
            error: 'Failed to fetch Steam inventory',
            message: error.message 
        });
    }
});

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 SteamPipe Backend Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test Steam API connection
    if (process.env.STEAM_API_KEY) {
        console.log('✅ Steam API key configured');
    } else {
        console.warn('⚠️  Steam API key not configured');
    }
    
    if (process.env.BACKEND_PRIVATE_KEY) {
        console.log('✅ Backend private key configured');
    } else {
        console.warn('⚠️  Backend private key not configured');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
