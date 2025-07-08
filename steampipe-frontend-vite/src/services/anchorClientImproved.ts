import { AnchorProvider, Program, web3, BN, ProgramError } from '@project-serum/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import IDL from '../idl/steampipe-updated.json';
import { 
  PROGRAM_ID, 
  USDC_MINT, 
  SOLANA_RPC_URL
} from '../config';

// Define error types for better error handling
export class AnchorClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AnchorClientError';
  }
}

// Define types for account data
export interface UserAccount {
  owner: PublicKey;
  steamId: string;
  steamLinked: boolean;
  tradesCount: BN;
  createdAt: BN;
}

export interface ListingAccount {
  seller: PublicKey;
  itemId: string;
  itemName: string;
  price: BN;
  state: { active?: {} } | { sold?: {} } | { cancelled?: {} };
  createdAt: BN;
}

export interface TradeEscrowAccount {
  tradeId: BN;
  buyer: PublicKey;
  seller: PublicKey;
  amount: BN;
  steamItemId: string;
  state: { initiated?: {} } | { fundsLocked?: {} } | { steamVerified?: {} } | 
         { steamTransferred?: {} } | { completed?: {} } | { cancelled?: {} } | { disputed?: {} };
  createdAt: BN;
  expiresAt: BN;
  steamTradeUrl: string;
  disputeReason: string;
}

export interface TradeStateChangedEvent {
  tradeId: BN;
  oldState: any;
  newState: any;
  timestamp: BN;
}

export class AnchorClientImproved {
  private program: Program;
  private provider: AnchorProvider;
  private eventListeners: Map<number, string> = new Map();

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(IDL as any, new PublicKey(PROGRAM_ID), provider);
  }

  /**
   * Get user PDA
   */
  public getUserPDA(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), owner.toBuffer()],
      this.program.programId
    );
  }

  /**
   * Get listing PDA
   */
  public getListingPDA(seller: PublicKey, itemId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('listing'), seller.toBuffer(), Buffer.from(itemId)],
      this.program.programId
    );
  }

  /**
   * Get escrow PDA
   */
  public getEscrowPDA(tradeId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), new BN(tradeId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );
  }

  /**
   * Get escrow token account PDA
   */
  public getEscrowTokenAccountPDA(escrowAccount: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowAccount.toBuffer()],
      this.program.programId
    );
  }

  /**
   * Initialize user account
   */
  async initializeUser(): Promise<string> {
    try {
      const [userPDA] = this.getUserPDA(this.provider.wallet.publicKey);

      const tx = await this.program.methods
        .initializeUser()
        .accounts({
          user: userPDA,
          owner: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error initializing user:', error);
      this.handleError(error, 'Failed to initialize user');
    }
  }

  /**
   * Link Steam account
   */
  async linkSteamAccount(steamId: string): Promise<string> {
    try {
      const [userPDA] = this.getUserPDA(this.provider.wallet.publicKey);

      const tx = await this.program.methods
        .linkSteamAccount(steamId)
        .accounts({
          user: userPDA,
          owner: this.provider.wallet.publicKey,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error linking Steam account:', error);
      this.handleError(error, 'Failed to link Steam account');
    }
  }

  /**
   * Create listing
   */
  async createListing(itemId: string, price: number, itemName: string): Promise<string> {
    try {
      const [userPDA] = this.getUserPDA(this.provider.wallet.publicKey);
      const [listingPDA] = this.getListingPDA(this.provider.wallet.publicKey, itemId);

      const tx = await this.program.methods
        .createListing(itemId, new BN(price), itemName)
        .accounts({
          listing: listingPDA,
          user: userPDA,
          seller: this.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error creating listing:', error);
      this.handleError(error, 'Failed to create listing');
    }
  }

  /**
   * Initiate trade
   */
  async initiateTrade(
    listingAccount: PublicKey,
    sellerAccount: PublicKey,
    tradeId: number,
    steamTradeUrl: string
  ): Promise<string> {
    try {
      const [buyerUserPDA] = this.getUserPDA(this.provider.wallet.publicKey);
      const [sellerUserPDA] = this.getUserPDA(sellerAccount);
      const [escrowPDA] = this.getEscrowPDA(tradeId);
      const [escrowTokenAccountPDA] = this.getEscrowTokenAccountPDA(escrowPDA);

      // Get buyer's USDC token account
      const buyerTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(USDC_MINT),
        this.provider.wallet.publicKey
      );

      const tx = await this.program.methods
        .initiateTrade(new BN(tradeId), steamTradeUrl)
        .accounts({
          escrow: escrowPDA,
          listing: listingAccount,
          buyerUser: buyerUserPDA,
          sellerUser: sellerUserPDA,
          buyer: this.provider.wallet.publicKey,
          buyerTokenAccount: buyerTokenAccount,
          escrowTokenAccount: escrowTokenAccountPDA,
          usdcMint: new PublicKey(USDC_MINT),
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error initiating trade:', error);
      this.handleError(error, 'Failed to initiate trade');
    }
  }

  /**
   * Refund expired trade
   */
  async refundExpired(tradeId: number): Promise<string> {
    try {
      const [escrowPDA] = this.getEscrowPDA(tradeId);
      const [escrowTokenAccountPDA] = this.getEscrowTokenAccountPDA(escrowPDA);

      // Get buyer's USDC token account
      const buyerTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(USDC_MINT),
        this.provider.wallet.publicKey
      );

      const tx = await this.program.methods
        .refundExpired()
        .accounts({
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenAccountPDA,
          buyerTokenAccount: buyerTokenAccount,
          buyer: this.provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error refunding expired trade:', error);
      this.handleError(error, 'Failed to refund expired trade');
    }
  }

  /**
   * Dispute trade
   */
  async disputeTrade(tradeId: number, reason: string): Promise<string> {
    try {
      const [escrowPDA] = this.getEscrowPDA(tradeId);

      const tx = await this.program.methods
        .disputeTrade(reason)
        .accounts({
          escrow: escrowPDA,
          disputer: this.provider.wallet.publicKey,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error disputing trade:', error);
      this.handleError(error, 'Failed to dispute trade');
    }
  }

  /**
   * Cancel listing
   */
  async cancelListing(itemId: string): Promise<string> {
    try {
      const [listingPDA] = this.getListingPDA(this.provider.wallet.publicKey, itemId);

      const tx = await this.program.methods
        .cancelListing()
        .accounts({
          listing: listingPDA,
          seller: this.provider.wallet.publicKey,
        })
        .rpc({ commitment: 'confirmed' });
      
      return tx;
    } catch (error) {
      console.error('Error cancelling listing:', error);
      this.handleError(error, 'Failed to cancel listing');
    }
  }

  /**
   * Get user account
   */
  async getUserAccount(owner: PublicKey): Promise<UserAccount | null> {
    try {
      const [userPDA] = this.getUserPDA(owner);
      const account = await this.program.account.user.fetch(userPDA) as UserAccount;
      return account;
    } catch (error) {
      console.error('Error fetching user account:', error);
      return null;
    }
  }

  /**
   * Get listing account
   */
  async getListingAccount(seller: PublicKey, itemId: string): Promise<ListingAccount | null> {
    try {
      const [listingPDA] = this.getListingPDA(seller, itemId);
      const account = await this.program.account.listing.fetch(listingPDA) as ListingAccount;
      return account;
    } catch (error) {
      console.error('Error fetching listing account:', error);
      return null;
    }
  }

  /**
   * Get escrow account
   */
  async getEscrowAccount(tradeId: number): Promise<TradeEscrowAccount | null> {
    try {
      const [escrowPDA] = this.getEscrowPDA(tradeId);
      const account = await this.program.account.tradeEscrow.fetch(escrowPDA) as TradeEscrowAccount;
      return account;
    } catch (error) {
      console.error('Error fetching escrow account:', error);
      return null;
    }
  }

  /**
   * Get all listings
   */
  async getAllListings(): Promise<{ publicKey: PublicKey; account: ListingAccount }[]> {
    try {
      const listings = await this.program.account.listing.all() as { publicKey: PublicKey; account: ListingAccount }[];
      return listings;
    } catch (error) {
      console.error('Error fetching all listings:', error);
      return [];
    }
  }

  /**
   * Get user's listings
   */
  async getUserListings(seller: PublicKey): Promise<{ publicKey: PublicKey; account: ListingAccount }[]> {
    try {
      const listings = await this.program.account.listing.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: seller.toBase58(),
          },
        },
      ]) as { publicKey: PublicKey; account: ListingAccount }[];
      return listings;
    } catch (error) {
      console.error('Error fetching user listings:', error);
      return [];
    }
  }

  /**
   * Get user's trades (as buyer)
   */
  async getUserTrades(buyer: PublicKey): Promise<{ publicKey: PublicKey; account: TradeEscrowAccount }[]> {
    try {
      const trades = await this.program.account.tradeEscrow.all([
        {
          memcmp: {
            offset: 16, // Skip discriminator + tradeId
            bytes: buyer.toBase58(),
          },
        },
      ]) as { publicKey: PublicKey; account: TradeEscrowAccount }[];
      return trades;
    } catch (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }
  }

  /**
   * Listen to events
   */
  addEventListener(eventName: string, callback: (event: any) => void): number {
    const listenerId = this.program.addEventListener(eventName, callback);
    this.eventListeners.set(listenerId, eventName);
    return listenerId;
  }

  /**
   * Remove event listener
   */
  async removeEventListener(listenerId: number): Promise<void> {
    try {
      await this.program.removeEventListener(listenerId);
      this.eventListeners.delete(listenerId);
    } catch (error) {
      console.error('Error removing event listener:', error);
    }
  }

  /**
   * Remove all event listeners
   */
  async removeAllEventListeners(): Promise<void> {
    try {
      for (const [listenerId] of this.eventListeners) {
        await this.program.removeEventListener(listenerId);
      }
      this.eventListeners.clear();
    } catch (error) {
      console.error('Error removing all event listeners:', error);
    }
  }

  /**
   * Helper methods for PDAs
   */
  getPublicKeys(tradeId?: number, seller?: PublicKey, itemId?: string) {
    const keys: any = {};
    
    if (seller) {
      keys.userPDA = this.getUserPDA(seller)[0];
    }
    
    if (seller && itemId) {
      keys.listingPDA = this.getListingPDA(seller, itemId)[0];
    }
    
    if (tradeId !== undefined) {
      keys.escrowPDA = this.getEscrowPDA(tradeId)[0];
      keys.escrowTokenAccountPDA = this.getEscrowTokenAccountPDA(keys.escrowPDA)[0];
    }
    
    return keys;
  }

  /**
   * Purchase an item using SOL or USDC
   * @param itemId The ID of the item to purchase
   * @param amount The amount to pay
   * @param currency The currency to use (SOL or USDC)
   * @returns Transaction signature
   */
  async purchaseItem(itemId: string, amount: number, currency: 'SOL' | 'USDC' = 'SOL'): Promise<string> {
    try {
      // In a real implementation, we would:
      // 1. Find the listing for this item
      // 2. Create a trade escrow account
      // 3. Transfer funds (SOL or USDC) to the escrow
      // 4. Initiate the trade process
      
      // For this demo, we'll simulate a successful transaction
      const wallet = this.provider.wallet;
      
      // Create a simple transaction that just includes a memo
      const transaction = new Transaction().add(
        new web3.TransactionInstruction({
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          ],
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(`Purchase ${itemId} for ${amount} ${currency}`),
        })
      );
      
      // Sign and send the transaction
      const signature = await this.provider.sendAndConfirm(transaction);
      
      return signature;
    } catch (error) {
      return this.handleError(error, 'Failed to purchase item');
    }
  }

  /**
   * Handle errors from Anchor
   */
  private handleError(error: any, defaultMessage: string): never {
    // Check if it's a program error
    if (error instanceof ProgramError) {
      const errorCode = error.code;
      let errorMessage = defaultMessage;
      
      // Map error codes to user-friendly messages
      switch (errorCode) {
        case 6000:
          errorMessage = 'Steam account is already linked';
          break;
        case 6001:
          errorMessage = 'Steam account is not linked';
          break;
        case 6002:
          errorMessage = 'Invalid listing state for this operation';
          break;
        case 6003:
          errorMessage = 'Invalid trade state for this operation';
          break;
        case 6004:
          errorMessage = 'Unauthorized backend authority';
          break;
        case 6005:
          errorMessage = 'Unauthorized admin';
          break;
        case 6006:
          errorMessage = 'Trade has not expired yet';
          break;
        case 6007:
          errorMessage = 'Only buyer or seller can dispute';
          break;
        case 6008:
          errorMessage = 'Invalid trade amount';
          break;
        case 6009:
          errorMessage = 'Insufficient funds for trade';
          break;
      }
      
      throw new AnchorClientError(errorMessage, `ERROR_${errorCode}`, error);
    }
    
    // Handle other types of errors
    throw new AnchorClientError(
      error.message || defaultMessage,
      'UNKNOWN_ERROR',
      error
    );
  }
}

export default AnchorClientImproved;
