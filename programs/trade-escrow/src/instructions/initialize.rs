use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = Config::LEN,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: Guardian key for emergency functions
    pub guardian: UncheckedAccount<'info>,

    /// CHECK: Fee recipient
    pub fee_recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    oracle_pubkeys: [Pubkey; 3],
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    config.oracle_pubkeys = oracle_pubkeys;
    config.paused = false;
    config.guardian = ctx.accounts.guardian.key();
    config.admin = ctx.accounts.admin.key();
    config.fee_bps = 50; // 0.5% default fee
    config.fee_recipient = ctx.accounts.fee_recipient.key();
    config.bump = ctx.bumps.config;

    Ok(())
}