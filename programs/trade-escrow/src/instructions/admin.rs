use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::*;

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        constraint = guardian.key() == config.guardian @ TradeEscrowError::UnauthorizedGuardian
    )]
    pub guardian: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        constraint = guardian.key() == config.guardian @ TradeEscrowError::UnauthorizedGuardian
    )]
    pub guardian: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateOracles<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        constraint = admin.key() == config.admin @ TradeEscrowError::UnauthorizedAdmin
    )]
    pub admin: Signer<'info>,
}

pub fn pause(ctx: Context<Pause>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.paused = true;

    emit!(EmergencyPause {
        triggered_by: ctx.accounts.guardian.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.paused = false;

    emit!(ConfigUpdated {
        updated_by: ctx.accounts.guardian.key(),
        change_type: "unpause".to_string(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

pub fn update_oracles(
    ctx: Context<UpdateOracles>,
    new_oracles: [Pubkey; 3],
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.oracle_pubkeys = new_oracles;

    emit!(ConfigUpdated {
        updated_by: ctx.accounts.admin.key(),
        change_type: "oracle_update".to_string(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}