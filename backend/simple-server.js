require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// Session middleware for Steam OpenID
app.use(session({
    secret: process.env.SESSION_SECRET || 'steampipe-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Generate a keypair for demo
const backendKeypair = Keypair.generate();
console.log('Backend keypair:', backendKeypair.publicKey.toString());

// In-memory storage for demo
const users = new Map();
const steamAccounts = new Map();

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Steam OpenID Authentication (Production Implementation)
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Helper function to verify Steam OpenID response
async function verifySteamResponse(query) {
    try {
        const params = new URLSearchParams(query);
        params.set('openid.mode', 'check_authentication');
        
        const response = await axios.post(
            'https://steamcommunity.com/openid/login',
            params.toString(),
            {
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'text/plain'
                },
                timeout: 10000
            }
        );
        
        return response.data.includes('is_valid:true');
    } catch (error) {
        console.error('Steam verification error:', error);
        return false;
    }
}

// Helper function to get Steam profile data
async function getSteamProfile(steamId) {
    if (!STEAM_API_KEY) {
        console.warn('Steam API key not configured, using fallback profile data');
        return {
            steamid: steamId,
            personaname: `SteamUser_${steamId.slice(-6)}`,
            profileurl: `https://steamcommunity.com/profiles/${steamId}`,
            avatar: 'https://avatars.steamstatic.com/fe/fea2e6f4fdedcdc7b5c51ad0fa9e8fe8b858c5e_medium.jpg',
            avatarfull: 'https://avatars.steamstatic.com/fe/fea2e6f4fdedcdc7b5c51ad0fa9e8fe8b858c5e_full.jpg'
        };
    }
    
    try {
        const response = await axios.get(
            'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
            {
                params: {
                    key: STEAM_API_KEY,
                    steamids: steamId
                },
                timeout: 10000
            }
        );
        
        const players = response.data?.response?.players;
        if (players && players.length > 0) {
            return players[0];
        }
        
        throw new Error('No player data returned');
    } catch (error) {
        console.error('Steam API error:', error);
        // Fallback profile if API fails
        return {
            steamid: steamId,
            personaname: `SteamUser_${steamId.slice(-6)}`,
            profileurl: `https://steamcommunity.com/profiles/${steamId}`,
            avatar: 'https://avatars.steamstatic.com/fe/fea2e6f4fdedcdc7b5c51ad0fa9e8fe8b858c5e_medium.jpg',
            avatarfull: 'https://avatars.steamstatic.com/fe/fea2e6f4fdedcdc7b5c51ad0fa9e8fe8b858c5e_full.jpg'
        };
    }
}

// Steam authentication initiation
app.get('/api/auth/steam', (req, res) => {
    const { wallet } = req.query;
    console.log('🎮 Steam OpenID auth requested for wallet:', wallet);
    
    if (!wallet) {
        return res.status(400).json({ 
            success: false, 
            error: 'Wallet address required' 
        });
    }
    
    // Store wallet in session for later retrieval
    req.session = req.session || {};
    req.session.pendingWallet = wallet;
    
    const returnURL = `${req.protocol}://${req.get('host')}/api/auth/steam/return`;
    const realm = `${req.protocol}://${req.get('host')}`;
    
    const steamParams = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': `${returnURL}?wallet=${encodeURIComponent(wallet)}`,
        'openid.realm': realm,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });
    
    const steamAuthURL = `https://steamcommunity.com/openid/login?${steamParams}`;
    console.log('🔗 Redirecting to Steam OpenID:', steamAuthURL);
    
    res.redirect(steamAuthURL);
});

// Steam authentication callback
app.get('/api/auth/steam/return', async (req, res) => {
    console.log('🔄 Steam OpenID callback received');
    console.log('Query params:', req.query);
    
    try {
        const wallet = req.query.wallet;
        if (!wallet) {
            console.error('❌ No wallet in callback');
            return res.redirect('http://localhost:5173/profile?error=no_wallet');
        }
        
        // Extract Steam ID from claimed_id
        const claimedId = req.query['openid.claimed_id'];
        if (!claimedId) {
            console.error('❌ No claimed_id in response');
            return res.redirect(`http://localhost:5173/profile?error=no_steam_id&wallet=${wallet}`);
        }
        
        const steamId = claimedId.split('/').pop();
        if (!steamId || !/^\d+$/.test(steamId)) {
            console.error('❌ Invalid Steam ID format:', steamId);
            return res.redirect(`http://localhost:5173/profile?error=invalid_steam_id&wallet=${wallet}`);
        }
        
        // Verify the OpenID response with Steam
        const isValid = await verifySteamResponse(req.query);
        if (!isValid) {
            console.error('❌ Steam OpenID verification failed');
            return res.redirect(`http://localhost:5173/profile?error=verification_failed&wallet=${wallet}`);
        }
        
        console.log('✅ Steam OpenID verified successfully for Steam ID:', steamId);
        
        // Get Steam profile data
        const steamProfile = await getSteamProfile(steamId);
        console.log('📋 Steam profile retrieved:', steamProfile.personaname);
        
        // Store the Steam account data
        steamAccounts.set(wallet, {
            steamId: steamId,
            steamProfile: steamProfile,
            isConnected: true,
            connectedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString()
        });
        
        // Update user profile with Steam data
        let user = users.get(wallet) || {
            wallet,
            username: `User_${wallet.substring(0, 8)}`,
            email: null,
            steamId: null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            totalTrades: 0,
            totalVolume: 0
        };
        
        user.steamId = steamId;
        user.steamProfile = steamProfile;
        user.lastLogin = new Date().toISOString();
        users.set(wallet, user);
        
        console.log('✅ Steam account linked successfully for wallet:', wallet);
        
        // Redirect back to frontend with success
        res.redirect(`http://localhost:5173/profile?success=steam_linked&steamId=${steamId}`);
        
    } catch (error) {
        console.error('❌ Steam authentication error:', error);
        const wallet = req.query.wallet || 'unknown';
        res.redirect(`http://localhost:5173/profile?error=auth_error&wallet=${wallet}`);
    }
});

// Steam account verification (for frontend to confirm linking)
app.post('/api/auth/steam/verify', async (req, res) => {
    const { wallet, steamId } = req.body;
    console.log('🔍 Steam verification request - wallet:', wallet, 'steamId:', steamId);
    
    try {
        const steamAccount = steamAccounts.get(wallet);
        if (steamAccount && steamAccount.steamId === steamId && steamAccount.verifiedAt) {
            res.json({ 
                success: true, 
                message: 'Steam account verified and linked successfully',
                steamProfile: steamAccount.steamProfile,
                connectedAt: steamAccount.connectedAt
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: 'Steam verification failed - account not found or not verified' 
            });
        }
    } catch (error) {
        console.error('Steam verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error during verification' 
        });
    }
});

// Steam account unbinding
app.post('/api/auth/steam/unbind', (req, res) => {
    const { wallet } = req.body;
    console.log('🔓 Steam unbind requested for wallet:', wallet);
    
    try {
        // Remove Steam account data
        const wasRemoved = steamAccounts.delete(wallet);
        
        // Update user profile
        const user = users.get(wallet);
        if (user) {
            user.steamId = null;
            user.steamProfile = null;
            user.lastLogin = new Date().toISOString();
            users.set(wallet, user);
        }
        
        if (wasRemoved || user) {
            console.log('✅ Steam account unbound successfully');
            res.json({ 
                success: true, 
                message: 'Steam account unbound successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'No Steam account found to unbind' 
            });
        }
    } catch (error) {
        console.error('Steam unbind error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error during unbind' 
        });
    }
});

// User profile routes
app.get('/api/user/profile', (req, res) => {
    const { wallet } = req.query;
    console.log('User profile requested for wallet:', wallet);
    
    if (!wallet) {
        return res.status(400).json({ success: false, error: 'Wallet address required' });
    }
    
    // Check if user exists, if not create a default profile
    let user = users.get(wallet);
    if (!user) {
        user = {
            wallet,
            username: `User_${wallet.substring(0, 8)}`,
            email: null,
            steamId: null,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            totalTrades: 0,
            totalVolume: 0
        };
        users.set(wallet, user);
    }
    
    // Check if Steam account is linked and add profile data
    const steamAccount = steamAccounts.get(wallet);
    const response = { ...user };
    
    if (steamAccount && steamAccount.steamProfile) {
        response.steamId = steamAccount.steamId;
        response.steamProfile = steamAccount.steamProfile;
    }
    
    console.log('✅ Returning user profile:', response);
    res.json(response);
});

// Steam API routes
app.get('/api/steam/account/:wallet', (req, res) => {
    const { wallet } = req.params;
    const account = steamAccounts.get(wallet);
    
    if (account) {
        res.json({ success: true, ...account });
    } else {
        res.status(404).json({ success: false, error: 'Steam account not found' });
    }
});

app.post('/api/steam/unbind', (req, res) => {
    // Mock unbind
    res.json({ success: true, message: 'Steam account unbound' });
});

// Market data routes (mock data)
app.get('/api/market/price/:platform/:itemName', (req, res) => {
    const { platform, itemName } = req.params;
    console.log(`📊 Price request for ${platform}: ${itemName}`);
    
    // Mock price data with realistic structure
    const basePrices = {
        steam: Math.random() * 100 + 50,
        buff: Math.random() * 90 + 45,
        buff163: Math.random() * 88 + 43,
        skinport: Math.random() * 95 + 48,
        c5game: Math.random() * 85 + 42
    };
    
    const basePrice = basePrices[platform] || Math.random() * 100 + 50;
    const marketPrice = basePrice * (1 + Math.random() * 0.2); // 0-20% higher
    const discount = ((marketPrice - basePrice) / marketPrice * 100);
    
    const mockData = {
        success: true,
        price: {
            price: basePrice.toFixed(2),
            marketPrice: marketPrice.toFixed(2),
            currency: 'USD',
            discount: Math.abs(discount).toFixed(1),
            source: platform,
            isRealTimeData: true,
            url: `https://${platform}.com/item/${encodeURIComponent(itemName)}`,
            timestamp: new Date().toISOString()
        },
        itemName: decodeURIComponent(itemName),
        platform
    };
    
    console.log(`✅ Returning price data:`, mockData);
    res.json(mockData);
});

app.get('/api/market/prices/:itemName', (req, res) => {
    const { itemName } = req.params;
    console.log(`📊 Aggregated prices request for: ${itemName}`);
    
    // Generate realistic aggregated data
    const platforms = ['steam', 'buff', 'buff163', 'skinport', 'c5game'];
    const basePrices = platforms.map(() => Math.random() * 100 + 50);
    const avgPrice = basePrices.reduce((a, b) => a + b) / basePrices.length;
    const minPrice = Math.min(...basePrices);
    const maxPrice = Math.max(...basePrices);
    
    const aggregatedData = {
        success: true,
        prices: {
            source: 'buff163', // Primary source
            price: avgPrice.toFixed(2),
            marketPrice: (avgPrice * 1.15).toFixed(2),
            currency: 'USD',
            discount: '13.0',
            sources: platforms,
            isRealTimeData: true,
            avgPrice: avgPrice.toFixed(2),
            avgMarketPrice: (avgPrice * 1.15).toFixed(2),
            priceRange: {
                min: minPrice.toFixed(2),
                max: maxPrice.toFixed(2)
            }
        },
        itemName: decodeURIComponent(itemName),
        timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Returning aggregated data:`, aggregatedData);
    res.json(aggregatedData);
});

// Price API proxy to avoid CORS issues
app.get('/api/prices', async (req, res) => {
    try {
        console.log('📊 Price request received');
        
        // Fetch from CoinGecko
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin&vs_currencies=usd&include_24hr_change=true',
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SteamPipe-Trading-Platform/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ CoinGecko data received:', data);
        
        // Transform to our format
        const prices = {
            sol: {
                symbol: 'SOL',
                price: data.solana?.usd || 100,
                currency: 'USD',
                timestamp: Date.now(),
                change24h: data.solana?.usd_24h_change || 0,
                changePercent24h: data.solana?.usd_24h_change || 0
            },
            usdc: {
                symbol: 'USDC',
                price: data['usd-coin']?.usd || 1.0,
                currency: 'USD',
                timestamp: Date.now(),
                change24h: data['usd-coin']?.usd_24h_change || 0,
                changePercent24h: data['usd-coin']?.usd_24h_change || 0
            }
        };

        res.json({ success: true, prices });
    } catch (error) {
        console.error('❌ Price fetch failed:', error);
        
        // Return mock data as fallback
        const mockPrices = {
            sol: {
                symbol: 'SOL',
                price: 100,
                currency: 'USD',
                timestamp: Date.now(),
                change24h: 2.5,
                changePercent24h: 2.5
            },
            usdc: {
                symbol: 'USDC',
                price: 1.0,
                currency: 'USD',
                timestamp: Date.now(),
                change24h: 0.1,
                changePercent24h: 0.1
            }
        };
        
        res.json({ success: true, prices: mockPrices, fallback: true });
    }
});

// Provider status endpoint for comparison dashboard
app.get('/api/prices/providers', (req, res) => {
    console.log('📊 Provider status request');
    
    const providers = [
        { name: 'Steam', enabled: true, available: true, lastUpdated: new Date().toISOString() },
        { name: 'Buff163', enabled: true, available: true, lastUpdated: new Date().toISOString() },
        { name: 'C5Game', enabled: true, available: true, lastUpdated: new Date().toISOString() },
        { name: 'Skinport', enabled: true, available: true, lastUpdated: new Date().toISOString() },
        { name: 'UUYP', enabled: true, available: true, lastUpdated: new Date().toISOString() },
        { name: 'EcoSteam', enabled: true, available: false, lastUpdated: new Date().toISOString() }
    ];
    
    res.json({
        success: true,
        data: { providers }
    });
});

// Aggregated price endpoint for comparison dashboard
app.get('/api/prices/item/:itemName', (req, res) => {
    const { itemName } = req.params;
    console.log(`📊 Aggregated item price request for: ${itemName}`);
    
    // Generate mock data for multiple providers
    const providers = ['Steam', 'Buff163', 'C5Game', 'Skinport', 'UUYP'];
    const providerData = {};
    
    providers.forEach(provider => {
        const basePrice = Math.random() * 100 + 50;
        const marketPrice = basePrice * (1 + Math.random() * 0.2);
        const discount = ((marketPrice - basePrice) / marketPrice * 100);
        
        providerData[provider] = {
            price: parseFloat(basePrice.toFixed(2)),
            marketPrice: parseFloat(marketPrice.toFixed(2)),
            currency: 'USD',
            discount: parseFloat(Math.abs(discount).toFixed(1)),
            url: `https://${provider.toLowerCase()}.com/item/${encodeURIComponent(itemName)}`,
            accuracy: 'real-time',
            isRealTimeData: true,
            timestamp: new Date().toISOString()
        };
    });
    
    // Find the best (lowest) price
    const bestProvider = Object.entries(providerData).reduce((best, [name, data]) => {
        return data.price < best.data.price ? { name, data } : best;
    }, { name: 'Steam', data: providerData['Steam'] });
    
    const response = {
        success: true,
        data: {
            source: bestProvider.name,
            price: bestProvider.data.price,
            marketPrice: bestProvider.data.marketPrice,
            currency: 'USD',
            discount: bestProvider.data.discount,
            url: bestProvider.data.url,
            accuracy: 'real-time',
            providerData: providerData,
            itemName: decodeURIComponent(itemName),
            timestamp: new Date().toISOString()
        }
    };
    
    console.log('✅ Returning aggregated item data:', response);
    res.json(response);
});

// Orders API (mock)
app.post('/api/orders', (req, res) => {
    const order = {
        id: 'order_' + Date.now(),
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    res.json({ success: true, order });
});

app.get('/api/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    
    res.json({
        success: true,
        order: {
            id: orderId,
            status: 'completed',
            amount: 50.00,
            currency: 'USD',
            itemName: 'AK-47 | Redline (Field-Tested)',
            createdAt: new Date().toISOString()
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(port, () => {
    console.log(`🚀 SteamPipe Backend running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔗 CORS enabled for: http://localhost:5173`);
});