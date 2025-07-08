use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("TradeEscrow11111111111111111111111111111111");

pub mod instructions;
pub mod state;
pub mod errors;
pub mod utils;

use instructions::*;
use state::*;
use errors::*;

#[program]
pub mod trade_escrow {
    use super::*;

    /// Initialize the program config
    pub fn initialize(ctx: Context<Initialize>, oracle_pubkeys: [Pubkey; 3]) -> Result<()> {
        instructions::initialize(ctx, oracle_pubkeys)
    }

    /// Lock funds in escrow for a trade
    pub fn lock(
        ctx: Context<Lock>,
        asset_id: u64,
        amount: u64,
        price_max: u64,
        ask_signature: [u8; 64],
        deadline_offset: i64, // seconds from now
    ) -> Result<()> {
        instructions::lock(ctx, asset_id, amount, price_max, ask_signature, deadline_offset)
    }

    /// Settle escrow with oracle receipt
    pub fn settle(
        ctx: Context<Settle>,
        oracle_signatures: Vec<[u8; 64]>, // 2-of-3 signatures
    ) -> Result<()> {
        instructions::settle(ctx, oracle_signatures)
    }

    /// Refund buyer after deadline
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        instructions::refund(ctx)
    }

    /// Emergency pause (guardian only)
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause(ctx)
    }

    /// Unpause (guardian only)
    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::unpause(ctx)
    }

    /// Update oracle keys (admin only)
    pub fn update_oracles(ctx: Context<UpdateOracles>, new_oracles: [Pubkey; 3]) -> Result<()> {
        instructions::update_oracles(ctx, new_oracles)
    }
}

// Event emissions
#[event]
pub struct EscrowLocked {
    pub escrow_id: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub asset_id: u64,
    pub amount: u64,
    pub deadline: i64,
}

#[event]
pub struct EscrowSettled {
    pub escrow_id: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub oracle_count: u8,
}

#[event]
pub struct EscrowRefunded {
    pub escrow_id: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub reason: String,
}

#[event]
pub struct EmergencyPause {
    pub triggered_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ConfigUpdated {
    pub updated_by: Pubkey,
    pub change_type: String,
    pub timestamp: i64,
}