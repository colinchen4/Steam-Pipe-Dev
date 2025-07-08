# SteamPipe - Decentralized CS:GO Skin Trading Platform

A hybrid escrow trading platform for CS:GO skins built on Solana blockchain with Steam integration. Trade skins securely with USDC while maintaining Steam item verification.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solana](https://img.shields.io/badge/blockchain-Solana-purple.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue.svg)
![React](https://img.shields.io/badge/frontend-React-61dafb.svg)
![Node.js](https://img.shields.io/badge/backend-Node.js-green.svg)

## 🎯 Overview

SteamPipe revolutionizes CS:GO skin trading by combining the security of blockchain escrow with the familiarity of Steam trading. 

**Current**: Hybrid architecture with on-chain USDC escrow and off-chain Steam verification.  
**Future**: Pure Web3 model with wrapped NFTs and no-deposit trading. [See upgrade roadmap →](./WEB3-ARCHITECTURE-UPGRADE.md)

Our current hybrid architecture ensures:

- **💰 Secure Funds**: USDC locked in Solana smart contracts
- **🎮 Steam Integration**: Real item verification via Steam Web API
- **⚡ Fast Trading**: Automated trade execution and monitoring
- **🌍 Global Access**: Decentralized platform with worldwide reach

## ✨ Key Features

### 🔒 **Hybrid Escrow System**
- Smart contract-secured USDC payments
- Off-chain Steam item verification
- Automatic trade completion and refunds
- 7-state trade machine for security

### 💹 **Real-Time Pricing**
- Multi-platform price aggregation (Steam, Buff163, C5Game, Skinport, UUYP)
- Live SOL/USDC price tracking
- Time-based freshness indicators
- Automatic provider failovers

### 🌐 **Full-Stack Integration**
- React + Vite frontend with Material-UI
- Node.js + Express backend with Steam API
- Solana + Anchor smart contracts
- MongoDB for user management

### 🔐 **Security & Authentication**
- Steam OpenID integration
- Phantom wallet connection
- Session management with HTTP-only cookies
- Rate limiting and input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Steam Web API Key
- Phantom Wallet (for testing)

### 1. Clone & Install
```bash
git clone https://github.com/colinchen4/Steam-Pipe-Dev.git
cd Steam-Pipe-Dev

# Backend setup
cd backend
npm install

# Frontend setup
cd ../steampipe-frontend-vite
npm install
```

### 2. Environment Configuration
```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your Steam API key and configuration

# Frontend configuration
cd ../steampipe-frontend-vite
cp .env.example .env
# Edit .env with backend URL and Solana configuration
```

### 3. Start Development
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd steampipe-frontend-vite
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📋 Environment Variables

### Backend (`backend/.env`)
```env
# Required
SESSION_SECRET=your-session-secret
STEAM_API_KEY=your-steam-api-key

# Database
MONGODB_URI=mongodb://localhost:27017/steampipe

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=your-program-id

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

### Frontend (`steampipe-frontend-vite/.env`)
```env
# Backend connection
VITE_BACKEND_URL=http://localhost:3001

# Solana configuration
VITE_SOLANA_NETWORK=devnet
VITE_HELIUS_API_KEY=your-helius-api-key
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Solana Chain   │
│   (React)       │◄──►│  (Node.js)      │◄──►│   (Anchor)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Steam API     │
                       │  (Item Verify)  │
                       └─────────────────┘
```

### Trade Flow
1. **Seller** creates listing on-chain
2. **Buyer** initiates trade, locks USDC in escrow
3. **Backend** verifies seller has Steam item
4. **Backend** sends Steam trade offer to buyer
5. **Backend** monitors trade completion
6. **Backend** confirms completion, releases USDC to seller

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm start          # Production server
npm run dev        # Development with nodemon
npm run test       # Run tests
npm run lint       # Lint code
```

### Frontend
```bash
cd steampipe-frontend-vite
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview build
npm run lint       # Lint code
```

### ⚠️ API Testing (Use Sparingly)
```bash
cd _testing
# WARNING: These make real API calls and can trigger rate limiting
node test-all-price-providers.js    # Test all providers
node debug-ecosteam-direct.js       # Debug specific APIs
```

## 🔧 Technology Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Chakra UI** + **Material-UI** + **Ant Design**
- **Solana Web3.js** + **Anchor Framework**
- **React Router** + **i18next**

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Steam Web API** integration
- **MongoDB** + **Mongoose**
- **Passport** (Steam OpenID)
- **Helmet** + **CORS** + **Rate Limiting**

### Blockchain
- **Solana** blockchain
- **Anchor** framework (Rust)
- **SPL Token** (USDC)
- **Program ID**: Configurable

## 🔒 Security Features

- **Smart Contract Escrow**: Funds secured on-chain
- **Steam API Verification**: Real item ownership checks
- **Rate Limiting**: API protection
- **Input Validation**: Secure data handling
- **Session Management**: HTTP-only cookies
- **Timeout Mechanisms**: Prevent stuck funds

## 📊 Market Integration

- **Steam Community Market**: Official pricing
- **Buff163**: Chinese marketplace
- **C5Game**: Trading platform
- **Skinport**: Developer API
- **ECOsteam**: Business API
- **UUYP**: Mobile integration

## 🌟 Features

### Network Toggle
- **Devnet** (🟡): Safe testing environment
- **Mainnet** (🟢): Real trading (with warning modal)
- **Auto-refresh**: Balance updates on network switch

### Multi-language Support
- English
- Chinese (Simplified)
- Extensible i18n system

### Price Tracking
- Real-time SOL/USDC rates
- Multi-platform skin pricing
- Historical data tracking
- Freshness indicators

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guide for AI assistants
- **[Backend README](./backend/README.md)** - Backend API documentation
- **[Project Structure](./PROJECT-STRUCTURE.md)** - Codebase overview

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Use conventional commits

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/colinchen4/Steam-Pipe-Dev/issues)
- **Documentation**: Check [CLAUDE.md](./CLAUDE.md) for development guidance
- **Steam API**: [Steam Web API Documentation](https://steamcommunity.com/dev)

## 🎯 Roadmap

### Phase 1: Core Platform ✅
- [x] Smart contract escrow system
- [x] Steam API integration
- [x] Basic frontend interface
- [x] Price aggregation

### Phase 2: Enhanced Features 🚧
- [ ] Mobile responsive design
- [ ] Advanced filtering
- [ ] Reputation system
- [ ] Batch trading

### Phase 3: Pure Web3 Evolution 🌟
- [ ] Wrapped NFT system
- [ ] No-deposit trading
- [ ] Wallet-only onboarding
- [ ] Gasless transactions
- [ ] **[See detailed roadmap →](./WEB3-ARCHITECTURE-UPGRADE.md)**

### Phase 4: Scale & Growth 📋
- [ ] Mainnet deployment
- [ ] DeFi integrations
- [ ] Third-party APIs
- [ ] Community governance

---

<div align="center">

**Built with ❤️ for the CS:GO trading community**

[Website](https://steampipe.trade) • [Documentation](./CLAUDE.md) • [API Reference](./backend/README.md)

</div>