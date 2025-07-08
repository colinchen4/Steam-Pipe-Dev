use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program,
    instruction::Instruction,
    sysvar::instructions::load_instruction_at,
};
use crate::errors::*;

/// Verify Ed25519 signature
pub fn verify_signature(
    signature: &[u8; 64],
    message: &[u8],
    pubkey: &Pubkey,
) -> Result<bool> {
    // Create the Ed25519 verification instruction
    let instruction = ed25519_program::new_ed25519_instruction(
        pubkey,
        message,
        signature,
    );

    // In a real implementation, you would verify this via CPI or syscall
    // For now, we'll do a basic check
    if signature.iter().all(|&b| b == 0) {
        return Ok(false);
    }

    // TODO: Implement proper Ed25519 verification
    // This is a placeholder - in production, use proper cryptographic verification
    Ok(true)
}

/// Validate asset ID format
pub fn validate_asset_id(asset_id: u64) -> Result<()> {
    require!(asset_id > 0, TradeEscrowError::InvalidSignatureFormat);
    Ok(())
}

/// Calculate escrow deadline with bounds checking
pub fn calculate_deadline(offset_seconds: i64) -> Result<i64> {
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    
    // Minimum 1 minute, maximum 10 minutes
    require!(
        offset_seconds >= 60 && offset_seconds <= 600,
        TradeEscrowError::InvalidDeadline
    );
    
    Ok(current_time + offset_seconds)
}

/// Generate nonce for escrow uniqueness
pub fn generate_nonce() -> Result<u64> {
    let clock = Clock::get()?;
    Ok(clock.unix_timestamp as u64)
}

/// Validate price bounds
pub fn validate_price(amount: u64, max_price: u64) -> Result<()> {
    require!(amount > 0, TradeEscrowError::InvalidSignatureFormat);
    require!(amount <= max_price, TradeEscrowError::PriceExceedsMaximum);
    Ok(())
}