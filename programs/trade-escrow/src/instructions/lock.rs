use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;
use crate::utils::*;
use crate::*;

#[derive(Accounts)]
#[instruction(asset_id: u64, amount: u64, deadline_offset: i64)]
pub struct Lock<'info> {
    #[account(
        init,
        payer = buyer,
        space = Escrow::LEN,
        seeds = [
            ESCROW_SEED,
            buyer.key().as_ref(),
            seller.key().as_ref(),
            &asset_id.to_le_bytes(),
            &Clock::get()?.unix_timestamp.to_le_bytes(), // Use timestamp as nonce
        ],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller pubkey verified through signature
    pub seller: UncheckedAccount<'info>,

    /// Buyer's token account (USDC/SOL)
    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.amount >= amount @ TradeEscrowError::InsufficientFunds
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// Escrow token account (PDA)
    #[account(
        init,
        payer = buyer,
        token::mint = buyer_token_account.mint,
        token::authority = escrow,
        seeds = [b"escrow_vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn lock(
    ctx: Context<Lock>,
    asset_id: u64,
    amount: u64,
    price_max: u64,
    ask_signature: [u8; 64],
    deadline_offset: i64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    
    // Check if paused
    require!(!config.paused, TradeEscrowError::ContractPaused);
    
    // Verify deadline is reasonable (max 10 minutes)
    require!(
        deadline_offset > 0 && deadline_offset <= 600,
        TradeEscrowError::InvalidDeadline
    );

    let clock = Clock::get()?;
    let deadline = clock.unix_timestamp + deadline_offset;
    let nonce = clock.unix_timestamp as u64;

    // Verify seller's ask signature
    let ask_message = format!(
        "{}:{}:{}:{}:{}",
        asset_id,
        ctx.accounts.seller.key(),
        amount,
        deadline,
        nonce
    );
    
    require!(
        verify_signature(
            &ask_signature,
            &ask_message.as_bytes(),
            &ctx.accounts.seller.key()
        )?,
        TradeEscrowError::InvalidAskSignature
    );

    // Verify price doesn't exceed maximum
    require!(amount <= price_max, TradeEscrowError::PriceExceedsMaximum);

    // Calculate and include protocol fee
    let fee = config.calculate_fee(amount);
    let total_amount = amount + fee;

    // Transfer tokens to escrow
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, total_amount)?;

    // Initialize escrow state
    let escrow = &mut ctx.accounts.escrow;
    escrow.buyer = ctx.accounts.buyer.key();
    escrow.seller = ctx.accounts.seller.key();
    escrow.asset_id = asset_id;
    escrow.amount = amount;
    escrow.deadline = deadline;
    escrow.settled = false;
    escrow.nonce = nonce;
    escrow.bump = ctx.bumps.escrow;

    // Emit event
    emit!(EscrowLocked {
        escrow_id: escrow.key(),
        buyer: escrow.buyer,
        seller: escrow.seller,
        asset_id,
        amount,
        deadline,
    });

    Ok(())
}