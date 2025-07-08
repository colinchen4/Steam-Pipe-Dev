# SteamPipe Project Structure

This document outlines the clean, organized structure of the SteamPipe CS:GO Skin NFT Trading Platform.

## 📁 Active Development Files

### **`backend/`** - Production Backend
- `simple-server.js` - Main production server with Steam authentication
- `package.json` - Backend dependencies
- **Status**: ✅ Active development

### **`steampipe-frontend-vite/`** - Production Frontend  
- Modern React + Vite application
- Complete UI with internationalization (English/Chinese)
- Solana wallet integration
- **Status**: ✅ Active development

### **`_docs/`** - Documentation & Planning
- `README.md` - Main project documentation
- `CLAUDE.md` - Development guidelines
- `STEAM-SETUP.md` - Steam authentication setup
- Various project planning documents
- **Status**: 📚 Reference materials

### **`_testing/`** - Testing & Development Files
- All `test-*.js` files - API testing scripts
- `debug-*.js` files - Debug utilities
- Development JSON files and configurations
- **Status**: 🧪 Development tools (not for production)

### **`_archive/`** - Historical & Backup Files
- `steampipe-backend_backup/` - Previous backend versions
- `steampipe-frontend/` - Old React frontend
- `solana-dex/` - Experimental DEX implementation
- `dashboard/` - Legacy dashboard experiments
- Third-party libraries and old experiments
- **Status**: 📦 Archived (kept for reference)

## 🚀 Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend Setup**:
   ```bash
   cd steampipe-frontend-vite
   npm install
   npm run dev
   ```

## 🔄 Development Workflow

- **Active Development**: Work only in `backend/` and `steampipe-frontend-vite/`
- **Testing**: Use scripts in `_testing/` folder for API testing
- **Documentation**: Update files in `_docs/` folder
- **Archive**: Reference old implementations in `_archive/` folder

## 🎯 Production Ready Components

### ✅ Completed Features:
- **Steam OpenID Authentication** - Production-ready Steam login
- **Multi-language Support** - English/Chinese internationalization  
- **Solana Wallet Integration** - Phantom wallet with network switching
- **Price Comparison** - Real-time price data from multiple sources
- **Responsive UI** - Modern glassmorphic design with Material-UI
- **CS:GO Inventory Management** - Steam inventory with NFT conversion

### 🚧 In Development:
- Backend API endpoints for trading
- Smart contract integration
- Advanced trading features

## 📝 Notes

- All test files and experimental code moved to organized folders
- Clean git history with proper .gitignore
- Production-ready authentication and UI
- Scalable architecture for future development

---

*Last Updated: $(date)*
*Project Status: Clean & Organized ✨*