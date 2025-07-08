import { AnchorProvider, Program, web3, BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '../contexts/WalletContext';
import IDL from '../idl/steampipe.json';

// Program ID from the smart contract
const PROGRAM_ID = new PublicKey('F57etoXN3oKMdP7sWadGDHj7ENUVercGUehoct163gh9');

export class AnchorClient {
  private program: Program;
  private provider: AnchorProvider;

  constructor(provider: AnchorProvider) {
    this.provider = provider;
    this.program = new Program(IDL as any, PROGRAM_ID, provider);
  }

  // Initialize user account
  async initializeUser(): Promise<string> {
    try {
      const tx = await this.program.methods
        .initializeUser()
        .accounts({
          user: this.provider.wallet.publicKey,
          owner: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
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
      const tx = await this.program.methods
        .linkSteamAccount(steamId)
        .accounts({
          user: this.provider.wallet.publicKey,
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
      const listing = web3.Keypair.generate();
      
      const tx = await this.program.methods
        .createListing(itemId, new BN(price), itemName)
        .accounts({
          listing: listing.publicKey,
          user: this.provider.wallet.publicKey,
          owner: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([listing])
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  // Purchase item
  async purchaseItem(listingPublicKey: PublicKey, price: number): Promise<string> {
    const [escrowPDA, escrowBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), listingPublicKey.toBuffer()],
      PROGRAM_ID
    );

    try {
      const tx = await this.program.methods
        .purchase(escrowBump)
        .accounts({
          listing: listingPublicKey,
          buyer: this.provider.wallet.publicKey,
          escrow: escrowPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error purchasing item:', error);
      throw error;
    }
  }

  // Complete trade
  async completeTrade(listingPublicKey: PublicKey, sellerPublicKey: PublicKey): Promise<string> {
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), listingPublicKey.toBuffer()],
      PROGRAM_ID
    );

    try {
      const tx = await this.program.methods
        .completeTrade()
        .accounts({
          listing: listingPublicKey,
          escrow: escrowPDA,
          seller: sellerPublicKey,
          buyer: this.provider.wallet.publicKey,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error completing trade:', error);
      throw error;
    }
  }

  // Cancel trade
  async cancelTrade(listingPublicKey: PublicKey): Promise<string> {
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), listingPublicKey.toBuffer()],
      PROGRAM_ID
    );

    try {
      const tx = await this.program.methods
        .cancelTrade()
        .accounts({
          listing: listingPublicKey,
          escrow: escrowPDA,
          buyer: this.provider.wallet.publicKey,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error canceling trade:', error);
      throw error;
    }
  }

  // Fetch user account
  async fetchUserAccount(): Promise<any> {
    try {
      const userAccount = await this.program.account.user.fetch(
        this.provider.wallet.publicKey
      );
      return userAccount;
    } catch (error) {
      console.error('Error fetching user account:', error);
      throw error;
    }
  }

  // Fetch all listings
  async fetchAllListings(): Promise<any[]> {
    try {
      const listings = await this.program.account.listing.all();
      return listings.filter(listing => listing.account.state.active !== undefined);
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  // Fetch user listings
  async fetchUserListings(): Promise<any[]> {
    try {
      const listings = await this.program.account.listing.all([
        {
          memcmp: {
            offset: 8, // After the discriminator
            bytes: this.provider.wallet.publicKey.toBase58(),
          },
        },
      ]);
      return listings;
    } catch (error) {
      console.error('Error fetching user listings:', error);
      throw error;
    }
  }
}
