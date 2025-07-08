use anchor_lang::prelude::*;

#[account]
pub struct Config {
    /// Oracle public keys (3 total, need 2-of-3 signatures)
    pub oracle_pubkeys: [Pubkey; 3],
    /// Emergency pause flag
    pub paused: bool,
    /// Guardian key for emergency functions
    pub guardian: Pubkey,
    /// Admin key for updates
    pub admin: Pubkey,
    /// Protocol fee in basis points (e.g., 50 = 0.5%)
    pub fee_bps: u16,
    /// Fee recipient
    pub fee_recipient: Pubkey,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 
        8 +    // discriminator
        32 * 3 + // oracle_pubkeys
        1 +    // paused
        32 +   // guardian
        32 +   // admin
        2 +    // fee_bps
        32 +   // fee_recipient
        1;     // bump

    pub fn is_oracle(&self, pubkey: &Pubkey) -> bool {
        self.oracle_pubkeys.contains(pubkey)
    }

    pub fn calculate_fee(&self, amount: u64) -> u64 {
        (amount as u128 * self.fee_bps as u128 / 10000) as u64
    }
}

/// Seeds for config PDA
pub const CONFIG_SEED: &[u8] = b"config";

/// Generate config PDA
pub fn get_config_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[CONFIG_SEED], program_id)
}