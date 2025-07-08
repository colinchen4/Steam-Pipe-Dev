# Web3 Architecture Upgrade - Pure On-Chain Design

This document outlines the evolution from our current hybrid escrow model to a pure Web3 architecture with wrapped NFTs and no-deposit trading.

## 🎯 Vision: Pure Web3 Trading Platform

Transform SteamPipe into a fully decentralized trading platform where Steam items become wrapped NFTs, eliminating deposits while maintaining security through smart contract automation.

## 📋 Current vs Target Architecture

### Current (Hybrid Model)
```
User Funds (USDC) → Smart Contract Escrow
Steam Items → Off-chain verification → Manual trade completion
```

### Target (Pure Web3 Model)
```
Steam Items → Custodial Bot → Wrapped NFTs (1:1 representation)
Trading → Direct smart contract execution → Automatic settlement
```

## 🏗️ Core Architecture: No-Deposit Model

### Smart Contract Flow
1. **Users execute TradeProgram directly** - No manual escrow steps
2. **Contract escrows fees automatically** - Built-in fee routing
3. **Wrapped NFTs represent ownership** - Steam items → on-chain assets
4. **Automatic payout on completion** - No manual intervention needed

### NFT Wrapping System
```solana
pub struct WrappedSteamItem {
    pub steam_item_id: String,
    pub mint_authority: Pubkey,
    pub vault_pda: Pubkey,
    pub metadata: ItemMetadata,
    pub custodial_bot: Pubkey,
}
```

## ⚠️ Critical Risk Analysis

### 1. Steam Policy Risk
- **Risk**: Valve API throttling, bot account freezes
- **Impact**: Platform functionality disruption
- **Mitigation**: Multi-bot rotation, API key distribution

### 2. Delivery Oracle Risk
- **Risk**: On-chain swap ≠ guaranteed Steam delivery
- **Impact**: Users receive NFT but no Steam item
- **Mitigation**: Timeout-based auto-refunds, delivery confirmation TXs

### 3. Price Oracle Risk
- **Risk**: Stale pricing data exploitation
- **Impact**: Arbitrage attacks, unfair trades
- **Mitigation**: Real-time price feeds, maximum staleness limits

### 4. Network Fee Spikes
- **Risk**: SOL fees exceed platform commission
- **Impact**: Users refuse to sign transactions
- **Mitigation**: `maximum_fee_lamports` parameter, fee sponsorship

### 5. Double-Spend Risk
- **Risk**: Bot transfers item while NFT exists
- **Impact**: NFT holders lose underlying assets
- **Mitigation**: Forced redeem protocol, vault PDA locks

## 🛡️ Security Mitigations (Planned)

### Delivery Oracle Service
```javascript
// Bot confirmation flow
const deliveryProof = await bot.confirmDelivery(tradeId);
await contract.submitDeliveryProof(deliveryProof);
// Auto-refund if no proof within timeout
```

### Signed Off-Chain Orderbook
```typescript
interface SignedOrder {
  order: TradeOrder;
  signature: string;
  nonce: number;
  expiry: number;
}
```

### Fee Protection
```solana
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct TradeInstruction {
    pub maximum_fee_lamports: u64, // Auto-abort if exceeded
}
```

### Forced Redeem Protocol
```solana
// NFT must be burned before bot releases item
pub fn redeem_steam_item(ctx: Context<RedeemItem>) -> Result<()> {
    // Burn wrapped NFT
    burn_wrapped_nft(&ctx.accounts.wrapped_nft)?;
    // Signal bot to release Steam item
    emit!(ItemRedemptionEvent { ... });
    Ok(())
}
```

## 🔄 Upgradeability Framework

### Multi-Sig Governance
- **Upgrade Authority**: 2/3 multisig (Squads v3)
- **Hot-fix Flow**: `anchor build` → Squads proposal → `anchor upgrade`
- **Deployment**: BPFLoaderUpgradeable via Anchor
- **Emergency Circuit**: `paused` flag in Config PDA

### Upgrade Process
```bash
# 1. Build new program
anchor build

# 2. Create Squads proposal
squads-cli propose-upgrade program.so

# 3. Execute upgrade (< 5 min total)
anchor upgrade --program-id <PROGRAM_ID>
```

## 🔒 Extra Security Hardening

### 1. Bot Heartbeat System
```solana
pub struct BotHeartbeat {
    pub inventory_merkle_root: [u8; 32],
    pub timestamp: i64,
    pub bot_pubkey: Pubkey,
}

// Reject trades if last_heartbeat > 60s
require!(
    Clock::get()?.unix_timestamp - heartbeat.timestamp < 60,
    ErrorCode::BotOffline
);
```

### 2. Circuit Breaker Keys
```solana
pub struct GuardianPDA {
    pub authority: Pubkey,
    pub can_pause: bool,
    pub emergency_powers: bool,
}
```

### 3. Replay Protection
```solana
pub struct NonceTracker {
    pub consumed_nonces: BloomFilter, // Compact storage
    pub ecdsa_signatures: Vec<[u8; 64]>,
}
```

### 4. Time-Locked Upgrades
```solana
pub struct UpgradeTimelock {
    pub proposed_at: i64,
    pub delay_seconds: i64, // 1 hour default
    pub emergency_override: bool, // 2+ guardians required
}
```

### 5. Full Ledger Export
```solana
// Emit comprehensive events
#[event]
pub struct BalanceChangeEvent {
    pub user: Pubkey,
    pub token_mint: Pubkey,
    pub amount_delta: i64,
    pub new_balance: u64,
    pub transaction_type: String,
}
```

## 🌐 Native Web3 Experience

### 1. Wallet-Only Onboarding
```typescript
// No email/password required
const connectWallet = async () => {
  const wallet = await window.phantom.solana.connect();
  
  // Sign proof-of-player message (free)
  const message = `Proof of Player: ${Date.now()}`;
  const signature = await wallet.signMessage(message);
  
  // Create profile on-chain
  await createPlayerProfile(signature);
};
```

### 2. Public Orderbook API
```typescript
// Expose live liquidity data
app.get('/api/orderbook', async (req, res) => {
  const liveOffers = await solana.getTradeOfferAccounts();
  const publicOrderbook = offers.map(formatForExplorer);
  res.json(publicOrderbook);
});
```

### 3. SPL Token Price Feeds
```solana
// Enable DeFi integration
pub struct WrappedItemPriceFeed {
    pub token_mint: Pubkey,
    pub current_price_usdc: u64,
    pub last_updated: i64,
    pub price_source: String, // "steam", "buff163", etc.
}
```

### 4. Gasless Transactions
```typescript
// Fee sponsorship for small transactions
const sponsorTransaction = async (userTx: Transaction) => {
  const networkFee = await connection.getFeeForMessage(userTx.compileMessage());
  
  if (networkFee < SPONSORSHIP_THRESHOLD) {
    // Relayer pays the fee
    const sponsoredTx = await relayer.sponsorTransaction(userTx);
    return sponsoredTx; // User sees "0 SOL network fee"
  }
  
  return userTx;
};
```

## 🚀 Implementation Roadmap

### Phase 1: Foundation (4-6 weeks)
- [ ] Deploy TradeProgram with upgradeability
- [ ] Implement basic wrapped NFT system
- [ ] Set up custodial bot infrastructure
- [ ] Create delivery oracle service

### Phase 2: Security Hardening (3-4 weeks)
- [ ] Implement heartbeat system
- [ ] Add circuit breaker mechanisms
- [ ] Deploy replay protection
- [ ] Set up time-locked upgrades

### Phase 3: Web3 Experience (2-3 weeks)
- [ ] Wallet-only onboarding
- [ ] Public orderbook API
- [ ] SPL token price feeds
- [ ] Gasless transaction relayer

### Phase 4: Production Readiness (2-3 weeks)
- [ ] Comprehensive testing suite
- [ ] Security audit preparation
- [ ] Monitoring and alerting
- [ ] Mainnet deployment

## 🔧 Technical Implementation Notes

### Smart Contract Architecture
```
TradeProgram
├── Instructions
│   ├── initialize_trade()
│   ├── execute_swap()
│   ├── confirm_delivery()
│   └── emergency_pause()
├── Accounts
│   ├── TradeOffer
│   ├── WrappedItem
│   ├── BotHeartbeat
│   └── GuardianPDA
└── Events
    ├── TradeExecuted
    ├── DeliveryConfirmed
    └── EmergencyPause
```

### Bot Infrastructure
- **Multi-region deployment** for redundancy
- **Kubernetes orchestration** for auto-scaling
- **Redis pub/sub** for real-time coordination
- **Prometheus monitoring** for health metrics

### Frontend Integration
- **Real-time WebSocket** updates from on-chain events
- **Wallet adapter** supporting multiple providers
- **Transaction confirmation** UI with progress tracking
- **Gas estimation** and fee sponsorship indicators

## 📊 Success Metrics

### Technical KPIs
- **Trade Completion Rate**: >99.5%
- **Delivery Success Rate**: >99.9%
- **Average Settlement Time**: <30 seconds
- **Network Fee Coverage**: >90% sponsored

### Business KPIs
- **User Retention**: Pure wallet onboarding
- **Trading Volume**: On-chain transparency
- **DeFi Integration**: Third-party usage
- **Security Incidents**: Zero critical failures

---

This architecture represents a fundamental evolution toward true Web3 native trading, eliminating custodial risks while maintaining the security and automation that users expect from modern DeFi platforms.