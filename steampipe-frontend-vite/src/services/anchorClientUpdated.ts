import { AnchorProvider, Program, web3, BN } from '@project-serum/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import IDL from '../idl/steampipe-updated.json';
import { PROGRAM_ID, USDC_MINT } from '../config-updated';

export class AnchorClientUpdated {
  private program: Program;
  private provider: AnchorProvider;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(IDL as any, new PublicKey(PROGRAM_ID), provider);
  }

  // Get user PDA
  private getUserPDA(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), owner.toBuffer()],
      this.program.programId
    );
  }

  // Get listing PDA
  private getListingPDA(seller: PublicKey, itemId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('listing'), seller.toBuffer(), Buffer.from(itemId)],
      this.program.programId
    );
  }

  // Get escrow PDA
  private getEscrowPDA(tradeId: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), new BN(tradeId).toArrayLike(Buffer, 'le', 8)],
      this.program.programId
    );
  }

  // Get escrow token account PDA
  private getEscrowTokenAccountPDA(escrowAccount: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowAccount.toBuffer()],
      this.program.programId
    );
  }

  // Initialize user account
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
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  // Link Steam account
  async linkSteamAccount(steamId: string): Promise<string> {
    try {
      const [userPDA] = this.getUserPDA(this.provider.wallet.publicKey);

      const tx = await this.program.methods
        .linkSteamAccount(steamId)
        .accounts({
          user: userPDA,
          owner: this.provider.wallet.publicKey,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error linking Steam account:', error);
      throw error;
    }
  }

  // Create listing
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
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  // Initiate trade
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
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error initiating trade:', error);
      throw error;
    }
  }

  // Refund expired trade
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
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error refunding expired trade:', error);
      throw error;
    }
  }

  // Dispute trade
  async disputeTrade(tradeId: number, reason: string): Promise<string> {
    try {
      const [escrowPDA] = this.getEscrowPDA(tradeId);

      const tx = await this.program.methods
        .disputeTrade(reason)
        .accounts({
          escrow: escrowPDA,
          disputer: this.provider.wallet.publicKey,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error disputing trade:', error);
      throw error;
    }
  }

  // Cancel listing
  async cancelListing(itemId: string): Promise<string> {
    try {
      const [listingPDA] = this.getListingPDA(this.provider.wallet.publicKey, itemId);

      const tx = await this.program.methods
        .cancelListing()
        .accounts({
          listing: listingPDA,
          seller: this.provider.wallet.publicKey,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error cancelling listing:', error);
      throw error;
    }
  }

  // Get user account
  async getUserAccount(owner: PublicKey): Promise<any> {
    try {
      const [userPDA] = this.getUserPDA(owner);
      const account = await this.program.account.user.fetch(userPDA);
      return account;
    } catch (error) {
      console.error('Error fetching user account:', error);
      return null;
    }
  }

  // Get listing account
  async getListingAccount(seller: PublicKey, itemId: string): Promise<any> {
    try {
      const [listingPDA] = this.getListingPDA(seller, itemId);
      const account = await this.program.account.listing.fetch(listingPDA);
      return account;
    } catch (error) {
      console.error('Error fetching listing account:', error);
      return null;
    }
  }

  // Get escrow account
  async getEscrowAccount(tradeId: number): Promise<any> {
    try {
      const [escrowPDA] = this.getEscrowPDA(tradeId);
      const account = await this.program.account.tradeEscrow.fetch(escrowPDA);
      return account;
    } catch (error) {
      console.error('Error fetching escrow account:', error);
      return null;
    }
  }

  // Get all listings
  async getAllListings(): Promise<any[]> {
    try {
      const listings = await this.program.account.listing.all();
      return listings;
    } catch (error) {
      console.error('Error fetching all listings:', error);
      return [];
    }
  }

  // Get user's listings
  async getUserListings(seller: PublicKey): Promise<any[]> {
    try {
      const listings = await this.program.account.listing.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: seller.toBase58(),
          },
        },
      ]);
      return listings;
    } catch (error) {
      console.error('Error fetching user listings:', error);
      return [];
    }
  }

  // Get user's trades (as buyer)
  async getUserTrades(buyer: PublicKey): Promise<any[]> {
    try {
      const trades = await this.program.account.tradeEscrow.all([
        {
          memcmp: {
            offset: 16, // Skip discriminator + tradeId
            bytes: buyer.toBase58(),
          },
        },
      ]);
      return trades;
    } catch (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }
  }

  // Listen to events
  addEventListener(eventName: string, callback: (event: any) => void): number {
    return this.program.addEventListener(eventName, callback);
  }

  // Remove event listener
  removeEventListener(listenerId: number): Promise<void> {
    return this.program.removeEventListener(listenerId);
  }

  // Helper methods for PDAs
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
}

export default AnchorClientUpdated;
