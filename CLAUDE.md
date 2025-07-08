# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SteamPipe is a decentralized CS:GO skin trading platform built on Solana blockchain. 

**Current Architecture**: Hybrid escrow model where USDC funds are secured on-chain while Steam items are verified off-chain through Steam Web API integration.

**Future Architecture**: Pure Web3 model with wrapped NFTs representing Steam items, eliminating deposits while maintaining security through smart contract automation. See [WEB3-ARCHITECTURE-UPGRADE.md](./WEB3-ARCHITECTURE-UPGRADE.md) for the complete evolution roadmap.

The platform aggregates real-time pricing from multiple marketplaces (Steam, Buff163, C5Game, Skinport, ECOsteam, UUYP) and provides secure P2P trading with Steam OpenID authentication.

## Architecture

### Hybrid Escrow Model
- **Frontend (React + Vite)**: User interface with Phantom wallet integration
- **Backend (Node.js + Express)**: Steam API integration and trade verification
- **Smart Contract (Anchor/Rust)**: USDC escrow with 7-state trade machine
- **Trade Flow**: Seller lists → Buyer locks USDC → Backend verifies Steam item → Trade completes

### Key Technologies
- **Blockchain**: Solana + Anchor Framework + SPL Token (USDC)
- **Frontend**: React 18 + Vite + TypeScript + Chakra UI + Material-UI
- **Backend**: Node.js + Express + Steam Web API + MongoDB
- **Security**: Helmet, CORS, rate limiting, session management

## Development Commands

### Start Development Environment
```bash
# Terminal 1: Backend
cd backend
npm install
npm run start    # Production server (port 3001)
npm run dev      # Development with nodemon

# Terminal 2: Frontend
cd steampipe-frontend-vite
npm install
npm run dev      # Development server (port 5173)
```

### Testing
```bash
# Backend tests
cd backend
npm run test
npm run test -- --testNamePattern="specific test"  # Single test

# Market API testing (USE SPARINGLY - APIs have rate limits)
cd _testing
# WARNING: These scripts make real API calls and can trigger rate limiting
# Use only for debugging specific issues, not routine testing
```

### Build & Deploy
```bash
# Frontend build
cd steampipe-frontend-vite
npm run build
npm run preview

# Backend linting
cd backend
npm run lint
```

## Project Structure

### Frontend (`steampipe-frontend-vite/`)
- **`src/components/`**: Reusable UI components (Dashboard, TradingInterface, etc.)
- **`src/pages/`**: Route-based pages (LandingPage, TradingPage, etc.)
- **`src/contexts/`**: React contexts (WalletContext, AuthContext, PriceContext, TestModeContext, NetworkContext)
- **`src/services/`**: API clients (anchorClient.ts, priceService.ts, tradingApi.ts)
- **`src/idl/`**: Anchor IDL files for smart contract integration
- **`src/hooks/`**: Custom React hooks (useAnchorClient, useTradingState)
- **`src/types/`**: TypeScript type definitions

### Backend (`backend/`)
- **`server.js`**: Production-ready Express server with security, sessions, Steam OpenID
- **`routes/`**: API routes (authRoutes.js, steamRoutes.js)
- **`services/steamService.js`**: Steam Web API integration with rate limiting
- **`models/User.js`**: User model linking Solana wallets to Steam accounts
- **`config/database.js`**: MongoDB connection with health checks

### Smart Contract Integration
- **Framework**: Anchor (Rust) with IDL at `steampipe-frontend-vite/src/idl/steampipe.json`
- **Key Functions**: initializeUser, linkSteamAccount, createListing, purchase, completeTrade
- **State Machine**: 7-state trade flow (Active → InEscrow → Completed/Cancelled)
- **Events**: Comprehensive event emissions for all state changes

### Market Testing (`_testing/`)
- **50+ test scripts** for market API validation ⚠️ **USE SPARINGLY - APIs have strict rate limits**
- **Price Providers**: Buff163, C5Game, ECOsteam, Skinport, UUYP integration tests
- **Steam Integration**: Authentication, inventory, trade offer management
- **Debugging Tools**: API endpoint testing, rate limit validation, error handling
- **Important**: These make real API calls and can trigger blocking - use only for critical debugging

## Configuration

### Environment Setup
```bash
# Backend configuration
cd backend
cp .env.example .env
# Configure: SESSION_SECRET, STEAM_API_KEY, MONGODB_URI, SOLANA_RPC_URL

# Frontend configuration  
cd steampipe-frontend-vite
cp .env.example .env
# Configure: VITE_BACKEND_URL, VITE_SOLANA_NETWORK, VITE_HELIUS_API_KEY
```

### Key Environment Variables
- **Backend**: `STEAM_API_KEY`, `SESSION_SECRET`, `MONGODB_URI`, `SOLANA_PROGRAM_ID`
- **Frontend**: `VITE_BACKEND_URL`, `VITE_SOLANA_NETWORK`, `VITE_HELIUS_API_KEY`

## Development Features

### Network Toggle
- **Devnet (🟡)**: Safe testing with fake SOL
- **Mainnet (🟢)**: Real network with actual SOL (shows warning modal)
- **Auto-refresh**: Balance updates when switching networks
- **Persistent**: Network preference saved in localStorage

### Wallet Integration
- **Phantom Wallet**: Primary wallet adapter
- **Multi-network**: Devnet/mainnet switching
- **Steam Linking**: Wallet addresses linked to Steam accounts
- **Session Management**: Secure authentication flow

### Price Aggregation
- **Real-time**: SOL/USDC price tracking via Helius/CoinGecko
- **Multi-platform**: Steam, Buff163, C5Game, Skinport, UUYP comparison
- **Time-based**: Freshness indicators for price data
- **Fallback**: Automatic provider failover

## Security Considerations

### Backend Security
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Steam IDs, wallet addresses, trade data
- **Session Management**: HTTP-only cookies, secure sessions
- **CORS**: Proper cross-origin configuration
- **Helmet**: Security headers and CSP

### Smart Contract Security
- **State Validation**: Proper state transitions
- **Authorization**: Owner/authority checks
- **Escrow Protection**: Secure USDC handling
- **Timeout Refunds**: Prevent stuck funds
- **Event Emissions**: Comprehensive logging

## API Documentation

### Market API Integrations
- **Steam Community Market**: Public API for price data
- **Buff163**: Trading platform API
- **C5Game**: Chinese marketplace API
- **ECOsteam**: Business API with signing
- **Skinport**: Developer API
- **UUYP**: Mobile API integration

### Steam Web API
- **Authentication**: OpenID integration
- **Inventory**: Item ownership verification
- **Trade Offers**: Automated trade management
- **Rate Limits**: 100,000 calls per day

## Common Development Tasks

### Add New Market Provider
1. Create provider class in `_testing/` directory
2. Implement BasePriceProvider interface
3. Add to `test-all-price-providers.js`
4. ⚠️ **Test sparingly** - APIs have strict rate limits

### Debug Market API Issues
1. ⚠️ **WARNING**: `_testing/debug-*.js` scripts make real API calls
2. Check rate limits and authentication in code first
3. Validate item name mappings
4. Test fallback mechanisms only when necessary

### Deploy Smart Contract Updates
1. Update Anchor program
2. Generate new IDL
3. Update `steampipe-frontend-vite/src/idl/steampipe.json`
4. Test with devnet first

### Add New Trading Features
1. Update smart contract state machine
2. Modify backend verification logic
3. Update frontend UI components
4. Add comprehensive tests