# Item Locking Mechanisms for Wrapped NFTs

This document addresses the critical question: **How do you actually lock Steam items when they're wrapped to NFTs?**

## 🔍 The Core Challenge

Steam items exist in Valve's ecosystem with their own ownership rules. When we create wrapped NFTs, we need to ensure the underlying Steam item cannot be traded/transferred while the NFT exists.

## 🛠️ Technical Approaches

### 1. **Custodial Bot Vault (Most Practical)**

**How it works:**
- Platform operates verified Steam bot accounts
- Users deposit items to bot inventory via Steam trade
- Bot holds items in "vault" while NFT exists
- NFT burn triggers bot to release item back to user

```javascript
// Deposit flow
async function depositItemForWrapping(userSteamId, itemId) {
  // 1. User initiates Steam trade to bot
  const tradeOffer = await steamBot.createTradeOffer({
    partnerSteamId: userSteamId,
    itemsToReceive: [itemId]
  });
  
  // 2. Bot accepts trade automatically
  await tradeOffer.accept();
  
  // 3. Mint wrapped NFT on Solana
  const wrappedNFT = await mintWrappedItem({
    steamItemId: itemId,
    originalOwner: userWallet,
    custodialBot: botAddress
  });
  
  return wrappedNFT;
}

// Redeem flow
async function redeemWrappedItem(nftMint, recipientSteamId) {
  // 1. Burn wrapped NFT
  await burnNFT(nftMint);
  
  // 2. Bot creates return trade
  const returnTrade = await steamBot.createTradeOffer({
    partnerSteamId: recipientSteamId,
    itemsToGive: [originalItemId]
  });
  
  return returnTrade;
}
```

**Pros:**
- ✅ Reliable item locking
- ✅ Immediate deposit/withdrawal
- ✅ Compatible with Steam's terms
- ✅ Can handle complex items (unusual patterns, etc.)

**Cons:**
- ❌ Requires trust in platform (custodial risk)
- ❌ Steam bot accounts need maintenance
- ❌ Vulnerable to Steam policy changes

### 2. **Steam Trade Hold Mechanism**

**How it works:**
- Utilize Steam's 7-day trade hold feature
- Items sent to platform temporarily "locked"
- Platform promises to return after NFT burn
- Relies on Steam's built-in hold system

```javascript
async function createTradeHoldLock(userSteamId, itemId) {
  // User sends item to platform with 7-day hold
  const tradeOffer = await steamAPI.createTradeOffer({
    partner: userSteamId,
    itemsToReceive: [itemId],
    message: "NFT Wrapping - 7 day hold"
  });
  
  // During hold period, mint NFT
  const nft = await mintWrappedItem(itemId);
  
  // Platform commits to return item when NFT burned
  await recordLockCommitment(itemId, nft.mint);
  
  return nft;
}
```

**Pros:**
- ✅ Uses Steam's native locking
- ✅ No permanent custody needed
- ✅ Transparent hold period

**Cons:**
- ❌ 7-day minimum lock time
- ❌ Still requires platform trust
- ❌ Complex edge case handling

### 3. **Multi-Signature Steam Account**

**How it works:**
- Create shared Steam accounts controlled by multiple parties
- Require consensus to move items
- Distributed custody model

```javascript
// Conceptual - Steam doesn't support true multi-sig
async function multiSigSteamVault(item, signers) {
  // Requires custom Steam API integration
  const vaultAccount = await createSharedSteamAccount({
    controllers: signers,
    threshold: 2, // 2 of 3 signatures required
  });
  
  // Move item to shared account
  await transferToVault(item, vaultAccount);
  
  // Mint NFT with vault reference
  return await mintNFT({
    item,
    vault: vaultAccount,
    unlockRequires: signers.slice(0, 2) // Any 2 of 3
  });
}
```

**Pros:**
- ✅ Distributed trust model
- ✅ No single point of failure
- ✅ More decentralized

**Cons:**
- ❌ Steam doesn't support native multi-sig
- ❌ Complex coordination required
- ❌ Regulatory complications

### 4. **Hybrid Oracle + Insurance**

**How it works:**
- Combine multiple verification methods
- Use external oracles to verify item status
- Back with insurance fund for failures

```solana
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ItemLock {
    pub steam_item_id: String,
    pub custodial_bot: Pubkey,
    pub oracle_verifier: Pubkey,
    pub insurance_vault: Pubkey,
    pub lock_timestamp: i64,
    pub unlock_conditions: Vec<UnlockCondition>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum UnlockCondition {
    NFTBurn { mint: Pubkey },
    OracleConfirmation { oracle: Pubkey },
    TimeoutExpiry { seconds: i64 },
    InsuranceClaim { amount: u64 },
}
```

**Pros:**
- ✅ Multiple security layers
- ✅ Insurance against failures
- ✅ Oracle verification
- ✅ Timeout safety

**Cons:**
- ❌ Complex system design
- ❌ Higher operational costs
- ❌ Multiple trust assumptions

## 🏗️ Recommended Implementation: Custodial Vault 2.0

Given Steam's limitations, here's the most practical approach:

### Enhanced Custodial Model

```typescript
interface SteamItemVault {
  // Bot infrastructure
  botAccounts: SteamBot[];
  loadBalancer: BotLoadBalancer;
  
  // Security measures
  multiSigWithdrawals: boolean;
  insuranceFund: PublicKey;
  auditTrail: VaultAuditLog;
  
  // User protection
  emergencyWithdrawal: EmergencyProtocol;
  timeoutRefunds: AutoRefundSystem;
}

class EnhancedVaultSystem {
  async depositItem(userSteamId: string, itemId: string): Promise<WrappedNFT> {
    // 1. Select least-loaded bot
    const selectedBot = await this.loadBalancer.selectBot();
    
    // 2. Create trade with user
    const trade = await selectedBot.createSecureTrade({
      partner: userSteamId,
      itemsToReceive: [itemId],
      escrowDuration: 0 // Immediate if possible
    });
    
    // 3. Wait for trade confirmation
    await trade.waitForConfirmation();
    
    // 4. Verify item in bot inventory
    const verified = await selectedBot.verifyItemReceived(itemId);
    require(verified, "Item not received");
    
    // 5. Record vault state on-chain
    const vaultRecord = await this.recordVaultState({
      itemId,
      botAccount: selectedBot.steamId,
      depositTime: Date.now(),
      userWallet: userWallet
    });
    
    // 6. Mint wrapped NFT
    const nft = await this.mintWrappedNFT({
      steamItemId: itemId,
      vaultRecord: vaultRecord.publicKey,
      originalOwner: userWallet
    });
    
    return nft;
  }
  
  async redeemItem(nftMint: PublicKey, recipientSteamId: string): Promise<string> {
    // 1. Verify NFT ownership
    const nftAccount = await this.connection.getAccountInfo(nftMint);
    require(nftAccount, "NFT not found");
    
    // 2. Get vault record
    const vaultRecord = await this.getVaultRecord(nftMint);
    
    // 3. Burn NFT first (fail-safe)
    await this.burnNFT(nftMint);
    
    // 4. Signal bot to return item
    const bot = await this.getBotBySteamId(vaultRecord.botAccount);
    
    const returnTrade = await bot.createSecureTrade({
      partner: recipientSteamId,
      itemsToGive: [vaultRecord.itemId],
      message: "NFT Redemption"
    });
    
    // 5. Update vault state
    await this.markVaultRedeemed(vaultRecord.publicKey);
    
    return returnTrade.id;
  }
}
```

### Security Enhancements

```solana
// On-chain vault tracking
#[account]
pub struct VaultRecord {
    pub steam_item_id: String,
    pub custodial_bot_steam_id: String,
    pub nft_mint: Pubkey,
    pub original_owner: Pubkey,
    pub deposit_timestamp: i64,
    pub status: VaultStatus,
    pub emergency_unlock_time: i64, // Auto-unlock after 30 days
}

#[derive(AnchorSerialize, AnchorDeserialize, PartialEq)]
pub enum VaultStatus {
    Active,
    Redeemed,
    EmergencyUnlocked,
    InsuranceClaimed,
}

// Emergency unlock mechanism
pub fn emergency_unlock_vault(ctx: Context<EmergencyUnlock>) -> Result<()> {
    let vault = &mut ctx.accounts.vault_record;
    let clock = Clock::get()?;
    
    // Only allow after 30 days of inactivity
    require!(
        clock.unix_timestamp > vault.emergency_unlock_time,
        ErrorCode::EmergencyTimeNotReached
    );
    
    // Mark for emergency return
    vault.status = VaultStatus::EmergencyUnlocked;
    
    // Emit event for bot to process
    emit!(EmergencyUnlockEvent {
        vault: ctx.accounts.vault_record.key(),
        item_id: vault.steam_item_id.clone(),
        original_owner: vault.original_owner,
    });
    
    Ok(())
}
```

## 🛡️ Risk Mitigation Strategies

### 1. **Insurance Fund**
```solana
// Platform maintains insurance vault
#[account]
pub struct InsuranceFund {
    pub total_usdc: u64,
    pub claims_paid: u64,
    pub coverage_ratio: u64, // 150% of locked value
}
```

### 2. **Bot Rotation**
- Run 10+ bot accounts
- Rotate items between bots
- Isolate high-value items

### 3. **Real-time Monitoring**
```typescript
// Monitor bot inventory every 30 seconds
async function monitorBotInventory() {
  for (const bot of botAccounts) {
    const inventory = await bot.getInventory();
    const expectedItems = await getExpectedItems(bot.steamId);
    
    // Alert if items missing
    const missing = expectedItems.filter(item => !inventory.includes(item));
    if (missing.length > 0) {
      await triggerEmergencyAlert(bot, missing);
    }
  }
}
```

## 🎯 Reality Check

**The honest answer**: Steam's ecosystem isn't designed for DeFi. The custodial vault approach is the most practical solution, but it requires:

1. **Trust in platform operations**
2. **Steam API compliance**
3. **Insurance against failures**
4. **Transparent audit trails**

## 💡 Alternative: Prediction Market Model

Instead of "locking" items, consider a prediction market:

```typescript
// Users bet on item ownership/delivery
interface ItemPredictionMarket {
  itemId: string;
  currentOwner: string;
  predictedDelivery: Date;
  stakeholders: StakePosition[];
  resolutionOracle: PublicKey;
}
```

This avoids the locking problem entirely by creating financial incentives for honest behavior rather than technical locks.

---

**Bottom line**: The custodial vault is the most viable approach, but it requires exceptional operational security and transparency to maintain user trust.