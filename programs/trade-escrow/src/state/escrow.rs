use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    /// Buyer's wallet address
    pub buyer: Pubkey,
    /// Seller's wallet address  
    pub seller: Pubkey,
    /// Steam asset ID being traded
    pub asset_id: u64,
    /// Amount locked in escrow (in lamports or token units)
    pub amount: u64,
    /// Deadline for trade completion (Unix timestamp)
    pub deadline: i64,
    /// Whether the escrow has been settled
    pub settled: bool,
    /// Nonce for uniqueness
    pub nonce: u64,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Escrow {
    pub const LEN: usize = 
        8 +  // discriminator
        32 + // buyer
        32 + // seller
        8 +  // asset_id
        8 +  // amount
        8 +  // deadline
        1 +  // settled
        8 +  // nonce
        1;   // bump

    pub fn is_expired(&self) -> bool {
        Clock::get().unwrap().unix_timestamp > self.deadline
    }

    pub fn can_settle(&self) -> bool {
        !self.settled && !self.is_expired()
    }

    pub fn can_refund(&self) -> bool {
        !self.settled && self.is_expired()
    }
}

/// Seeds for PDA derivation
pub const ESCROW_SEED: &[u8] = b"escrow";

/// Generate escrow PDA
pub fn get_escrow_pda(
    buyer: &Pubkey,
    seller: &Pubkey,
    asset_id: u64,
    nonce: u64,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            ESCROW_SEED,
            buyer.as_ref(),
            seller.as_ref(),
            &asset_id.to_le_bytes(),
            &nonce.to_le_bytes(),
        ],
        program_id,
    )
}