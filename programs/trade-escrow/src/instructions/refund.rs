use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;
use crate::*;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(
        mut,
        constraint = escrow.can_refund() @ TradeEscrowError::CannotRefund,
        constraint = escrow.buyer == buyer.key() @ TradeEscrowError::UnauthorizedRefund
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// Escrow token account
    #[account(
        mut,
        seeds = [b"escrow_vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Buyer's token account to receive refund
    #[account(
        mut,
        constraint = buyer_token_account.owner == escrow.buyer,
        constraint = buyer_token_account.mint == escrow_token_account.mint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn refund(ctx: Context<Refund>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let config = &ctx.accounts.config;

    // Check if paused (allow refunds even when paused)
    // require!(!config.paused, TradeEscrowError::ContractPaused);

    // Calculate refund amount (include fee in refund)
    let fee = config.calculate_fee(escrow.amount);
    let refund_amount = escrow.amount + fee;

    // Create signer seeds for escrow PDA
    let signer_seeds = &[
        ESCROW_SEED,
        escrow.buyer.as_ref(),
        escrow.seller.as_ref(),
        &escrow.asset_id.to_le_bytes(),
        &escrow.nonce.to_le_bytes(),
        &[escrow.bump],
    ];

    // Transfer refund to buyer
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        },
        &[signer_seeds],
    );
    token::transfer(transfer_ctx, refund_amount)?;

    // Mark as settled (to prevent double refund)
    escrow.settled = true;

    // Emit event
    emit!(EscrowRefunded {
        escrow_id: escrow.key(),
        buyer: escrow.buyer,
        amount: refund_amount,
        reason: "Deadline expired".to_string(),
    });

    Ok(())
}