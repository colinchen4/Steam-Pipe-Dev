# 🚀 **Wallet-First Authentication Architecture**

## 🎯 **Core Philosophy:**
**Wallet = Primary Identity** | Steam = Optional Feature Enhancement

## 🔐 **Authentication Flow:**

### **Step 1: Wallet Login (Primary Authentication)**
```typescript
// Support multiple Solana wallets
const supportedWallets = [
  'Phantom',      // Current implementation
  'OKEx Wallet',  // New integration
  'Solflare',     // Popular option
  'Backpack',     // Growing wallet
  'Coinbase Wallet'
];

// User Experience:
1. User visits platform
2. Clicks "Connect Wallet"
3. Chooses wallet type (Phantom, OKEx, etc.)
4. Signs authentication message
5. ✅ Logged into platform with wallet address
```

### **Step 2: Steam Linking (Optional Enhancement)**
```typescript
// After wallet login, user can optionally link Steam
if (user.wantsAdvancedFeatures) {
  1. User clicks "Link Steam Account"
  2. Redirected to Steam OpenID
  3. Steam account linked to wallet address
  4. User provides their Steam API key
  5. ✅ Advanced trading features unlocked
}
```

---

## 🏗️ **Database Architecture:**

### **User Model (Wallet-Centric):**
```javascript
{
  // Primary Identity
  walletAddress: "Gh7B...9pQr",        // Primary key
  walletType: "phantom",               // phantom, okex, solflare, etc.
  
  // Authentication
  lastLogin: Date,
  createdAt: Date,
  isActive: true,
  
  // Optional Steam Integration
  steamAccount: {
    linked: false,                     // Is Steam linked?
    steamId: null,                     // Steam ID64 if linked
    steamProfile: {},                  // Cached Steam profile
    steamApiKey: null,                 // Encrypted user's API key
    linkedAt: null,                    // When was it linked
    lastSteamSync: null               // Last Steam data refresh
  },
  
  // Platform Data
  tradingStats: {
    totalTrades: 0,
    totalVolume: 0,
    reputation: 0
  },
  
  // Settings
  preferences: {
    defaultCurrency: "SOL",           // SOL, USDC
    notifications: true,
    privacy: "public"
  }
}
```

---

## 🔌 **Multi-Wallet Integration:**

### **Wallet Adapters:**
```typescript
// /frontend/src/services/walletService.ts

interface WalletAdapter {
  name: string;
  icon: string;
  connect(): Promise<string>; // Returns wallet address
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  isInstalled(): boolean;
}

class PhantomAdapter implements WalletAdapter {
  name = "Phantom";
  icon = "/icons/phantom.svg";
  
  async connect() {
    const phantom = window.solana;
    const response = await phantom.connect();
    return response.publicKey.toString();
  }
  
  async signMessage(message: string) {
    const signature = await window.solana.signMessage(
      new TextEncoder().encode(message)
    );
    return bs58.encode(signature.signature);
  }
  
  isInstalled() {
    return !!window.solana?.isPhantom;
  }
}

class OKExAdapter implements WalletAdapter {
  name = "OKEx Wallet";
  icon = "/icons/okex.svg";
  
  async connect() {
    const okex = window.okexchain?.solana;
    const response = await okex.connect();
    return response.publicKey.toString();
  }
  
  async signMessage(message: string) {
    const signature = await window.okexchain.solana.signMessage(
      new TextEncoder().encode(message)
    );
    return bs58.encode(signature.signature);
  }
  
  isInstalled() {
    return !!window.okexchain?.solana;
  }
}

// Wallet Manager
class WalletManager {
  private adapters = [
    new PhantomAdapter(),
    new OKExAdapter(),
    new SolflareAdapter(),
    new BackpackAdapter()
  ];
  
  getAvailableWallets() {
    return this.adapters.filter(adapter => adapter.isInstalled());
  }
  
  async connectWallet(walletName: string) {
    const adapter = this.adapters.find(a => a.name === walletName);
    if (!adapter) throw new Error('Wallet not supported');
    
    const address = await adapter.connect();
    return { address, walletType: walletName.toLowerCase() };
  }
}
```

### **Frontend Wallet Selection:**
```typescript
// /frontend/src/components/WalletSelection.tsx

const WalletSelection = () => {
  const walletManager = new WalletManager();
  const availableWallets = walletManager.getAvailableWallets();
  
  const handleWalletConnect = async (walletName: string) => {
    try {
      const { address, walletType } = await walletManager.connectWallet(walletName);
      
      // Authenticate with backend
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          walletType,
          signature: await signAuthMessage(address)
        })
      });
      
      const { user, token } = await authResponse.json();
      setUser(user);
      
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };
  
  return (
    <div className="wallet-selection">
      <h2>Connect Your Wallet</h2>
      {availableWallets.map(wallet => (
        <button 
          key={wallet.name}
          onClick={() => handleWalletConnect(wallet.name)}
          className="wallet-option"
        >
          <img src={wallet.icon} alt={wallet.name} />
          {wallet.name}
        </button>
      ))}
    </div>
  );
};
```

---

## 🎮 **Steam Integration (Optional):**

### **Steam Linking Component:**
```typescript
// /frontend/src/components/SteamLinking.tsx

const SteamLinking = ({ user, onUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  
  const linkSteamAccount = async () => {
    // Step 1: Steam OpenID authentication
    window.location.href = `/api/steam/link?wallet=${user.walletAddress}`;
  };
  
  const addSteamApiKey = async () => {
    await fetch('/api/steam/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: user.walletAddress,
        steamApiKey: apiKey
      })
    });
    onUpdate();
  };
  
  const unlinkSteam = async () => {
    await fetch('/api/steam/unlink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: user.walletAddress
      })
    });
    onUpdate();
  };
  
  if (!user.steamAccount.linked) {
    return (
      <div className="steam-linking">
        <h3>🎮 Optional: Link Steam Account</h3>
        <p>Link your Steam account to access advanced trading features</p>
        <button onClick={linkSteamAccount}>
          Connect Steam Account
        </button>
      </div>
    );
  }
  
  if (!user.steamAccount.steamApiKey) {
    return (
      <div className="steam-api-setup">
        <h3>🔑 Enable Advanced Features</h3>
        <p>Provide your Steam API key to access inventory and trading</p>
        <input 
          type="text"
          placeholder="Enter your Steam API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <button onClick={addSteamApiKey}>
          Enable Advanced Features
        </button>
        <a href="https://steamcommunity.com/dev/apikey" target="_blank">
          Get Steam API Key
        </a>
        <button onClick={unlinkSteam} className="unlink-btn">
          Unlink Steam Account
        </button>
      </div>
    );
  }
  
  return (
    <div className="steam-linked">
      <h3>✅ Steam Account Linked</h3>
      <p>Steam ID: {user.steamAccount.steamId}</p>
      <p>Profile: {user.steamAccount.steamProfile.personaname}</p>
      <button onClick={unlinkSteam} className="unlink-btn">
        Unlink Steam Account
      </button>
    </div>
  );
};
```

---

## 🛣️ **Backend API Routes:**

### **Wallet Authentication:**
```javascript
// /backend/routes/authRoutes.js

// Wallet login (primary authentication)
POST /api/auth/wallet
{
  walletAddress: "Gh7B...9pQr",
  walletType: "phantom",
  signature: "signed_message_proof"
}
→ Returns: { user, token }

// Wallet logout
POST /api/auth/logout
{ walletAddress: "Gh7B...9pQr" }

// Get user profile
GET /api/auth/profile/:walletAddress
→ Returns: { user }
```

### **Steam Integration (Optional):**
```javascript
// /backend/routes/steamRoutes.js

// Link Steam account to wallet
GET /api/steam/link?wallet=Gh7B...9pQr
→ Redirects to Steam OpenID

// Steam OpenID callback
GET /api/steam/callback?wallet=...&openid.identity=...
→ Links Steam ID to wallet

// Add user's Steam API key
POST /api/steam/apikey
{
  walletAddress: "Gh7B...9pQr",
  steamApiKey: "user_steam_api_key"
}

// Unlink Steam account
POST /api/steam/unlink
{
  walletAddress: "Gh7B...9pQr"
}

// Get Steam inventory (requires linked Steam + API key)
GET /api/steam/inventory/:walletAddress

// Send Steam trade (requires linked Steam + API key)
POST /api/steam/trade/send
{
  walletAddress: "Gh7B...9pQr",
  tradeDetails: {...}
}
```

---

## 🎨 **User Experience Flow:**

### **New User Journey:**
```
1. 🌐 User visits platform
2. 💼 Clicks "Connect Wallet"
3. 👛 Selects wallet (Phantom, OKEx, etc.)
4. ✅ Authenticated with wallet address
5. 🎯 Can use basic platform features

Optional Steam Enhancement:
6. 🎮 User clicks "Link Steam" (optional)
7. 🔐 Steam OpenID authentication
8. 🔑 User provides Steam API key
9. 🚀 Advanced trading features unlocked
```

### **Feature Access Levels:**

#### **Level 1: Wallet Only**
- ✅ Wallet balance display
- ✅ Basic SOL/USDC trading
- ✅ Price comparisons
- ✅ Platform statistics
- ❌ Steam inventory access
- ❌ CS:GO skin trading

#### **Level 2: Wallet + Steam Linked**
- ✅ Everything from Level 1
- ✅ Steam profile display
- ✅ Steam account verification
- ❌ Inventory access
- ❌ Trading capabilities

#### **Level 3: Wallet + Steam + API Key**
- ✅ Everything from Level 1 & 2
- ✅ CS:GO inventory access
- ✅ Steam trading capabilities
- ✅ Advanced skin analysis
- ✅ Full platform features

---

## 🔒 **Security & Privacy:**

### **Data Ownership:**
- **Wallet Address**: User controls via private key
- **Steam Data**: User provides own API key
- **Platform Data**: User can export/delete anytime

### **Unlinking Process:**
```typescript
const unlinkSteamAccount = async (walletAddress: string) => {
  // 1. Remove Steam API key from database
  // 2. Clear cached Steam data
  // 3. Disable Steam-dependent features
  // 4. User retains wallet-based features
  
  await User.updateOne(
    { walletAddress },
    {
      $set: {
        'steamAccount.linked': false,
        'steamAccount.steamId': null,
        'steamAccount.steamApiKey': null,
        'steamAccount.steamProfile': {}
      }
    }
  );
};
```

---

## 🎯 **Implementation Benefits:**

1. **🎪 Wallet-Centric**: True Web3 experience
2. **🔌 Multi-Wallet**: Support popular Solana wallets
3. **🎮 Optional Steam**: No forced Steam dependency
4. **🔒 User Privacy**: Users control their own data
5. **📱 Progressive**: Features unlock as user adds more integrations
6. **🔄 Flexible**: Easy to link/unlink accounts
7. **🚀 Scalable**: No backend API key bottlenecks

This architecture puts the **user and their wallet at the center**, with Steam as an optional enhancement for advanced trading features! 🎯