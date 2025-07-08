use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;
use crate::utils::*;
use crate::*;

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(
        mut,
        constraint = escrow.can_settle() @ TradeEscrowError::CannotSettle
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Escrow token account
    #[account(
        mut,
        seeds = [b"escrow_vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Seller's token account to receive payment
    #[account(
        mut,
        constraint = seller_token_account.owner == escrow.seller,
        constraint = seller_token_account.mint == escrow_token_account.mint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    /// Fee recipient account
    #[account(
        mut,
        constraint = fee_recipient_account.owner == config.fee_recipient,
        constraint = fee_recipient_account.mint == escrow_token_account.mint
    )]
    pub fee_recipient_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn settle(
    ctx: Context<Settle>,
    oracle_signatures: Vec<[u8; 64]>,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let config = &ctx.accounts.config;

    // Check if paused
    require!(!config.paused, TradeEscrowError::ContractPaused);

    // Verify we have at least 2 oracle signatures
    require!(
        oracle_signatures.len() >= 2,
        TradeEscrowError::InsufficientOracleSignatures
    );

    // Verify oracle signatures
    let settlement_message = format!(
        "settle:{}:{}:{}",
        escrow.asset_id,
        escrow.buyer,
        escrow.key()
    );

    let mut valid_signatures = 0;
    for signature in oracle_signatures.iter() {
        for oracle_pubkey in config.oracle_pubkeys.iter() {
            if verify_signature(signature, settlement_message.as_bytes(), oracle_pubkey)? {
                valid_signatures += 1;
                break;
            }
        }
    }

    require!(
        valid_signatures >= 2,
        TradeEscrowError::InvalidOracleSignatures
    );

    // Calculate amounts
    let fee = config.calculate_fee(escrow.amount);
    let seller_amount = escrow.amount;

    // Create signer seeds for escrow PDA
    let escrow_key = escrow.key();
    let signer_seeds = &[
        ESCROW_SEED,
        escrow.buyer.as_ref(),
        escrow.seller.as_ref(),
        &escrow.asset_id.to_le_bytes(),
        &escrow.nonce.to_le_bytes(),
        &[escrow.bump],
    ];

    // Transfer payment to seller
    let transfer_to_seller_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        },
        &[signer_seeds],
    );
    token::transfer(transfer_to_seller_ctx, seller_amount)?;

    // Transfer fee to protocol
    if fee > 0 {
        let transfer_fee_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.fee_recipient_account.to_account_info(),
                authority: escrow.to_account_info(),
            },
            &[signer_seeds],
        );
        token::transfer(transfer_fee_ctx, fee)?;
    }

    // Mark as settled
    escrow.settled = true;

    // Emit event
    emit!(EscrowSettled {
        escrow_id: escrow.key(),
        buyer: escrow.buyer,
        seller: escrow.seller,
        amount: seller_amount,
        oracle_count: valid_signatures,
    });

    Ok(())
}