use anchor_lang::prelude::*;

#[error_code]
pub enum TradeEscrowError {
    #[msg("Contract is currently paused")]
    ContractPaused,
    
    #[msg("Invalid deadline offset")]
    InvalidDeadline,
    
    #[msg("Invalid ask signature")]
    InvalidAskSignature,
    
    #[msg("Price exceeds maximum allowed")]
    PriceExceedsMaximum,
    
    #[msg("Insufficient funds in buyer account")]
    InsufficientFunds,
    
    #[msg("Cannot settle this escrow")]
    CannotSettle,
    
    #[msg("Cannot refund this escrow")]
    CannotRefund,
    
    #[msg("Insufficient oracle signatures")]
    InsufficientOracleSignatures,
    
    #[msg("Invalid oracle signatures")]
    InvalidOracleSignatures,
    
    #[msg("Unauthorized guardian")]
    UnauthorizedGuardian,
    
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
    
    #[msg("Unauthorized refund attempt")]
    UnauthorizedRefund,
    
    #[msg("Invalid signature format")]
    InvalidSignatureFormat,
    
    #[msg("Signature verification failed")]
    SignatureVerificationFailed,
}