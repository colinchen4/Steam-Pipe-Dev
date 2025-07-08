const axios = require('axios');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@project-serum/anchor');
const nacl = require('tweetnacl');

class SteamTradeManager {
    constructor(config) {
        this.steamApiKey = config.steamApiKey;
        this.backendKeypair = Keypair.fromSecretKey(new Uint8Array(config.backendPrivateKey));
        this.solanaConnection = new Connection(config.solanaRpcUrl);
        this.programId = new PublicKey(config.programId);
        
        // Initialize Anchor program
        const provider = new AnchorProvider(
            this.solanaConnection,
            new Wallet(this.backendKeypair),
            { commitment: 'confirmed' }
        );
        this.program = new Program(config.idl, this.programId, provider);
        
        this.client = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'SteamPipe-Trading-Bot/1.0'
            }
        });
    }

    /**
     * Verify Steam item ownership
     * @param {string} steamId - Steam ID of the seller
     * @param {string} itemId - Steam item ID
     * @returns {Promise<boolean>} - True if item exists in inventory
     */
    async verifyItemOwnership(steamId, itemId) {
        try {
            const url = `https://api.steampowered.com/IEconService/GetInventory/v1/`;
            const params = {
                key: this.steamApiKey,
                steamid: steamId,
                appid: 730, // CS:GO/CS2
                contextid: 2,
                count: 5000
            };

            const response = await this.client.get(url, { params });
            const inventory = response.data.response;

            if (!inventory || !inventory.assets) {
                console.log(`No inventory found for Steam ID: ${steamId}`);
                return false;
            }

            // Check if item exists in inventory
            const itemExists = inventory.assets.some(asset => asset.assetid === itemId);
            
            console.log(`Item ${itemId} ownership verification for ${steamId}: ${itemExists}`);
            return itemExists;

        } catch (error) {
            console.error('Error verifying item ownership:', error.message);
            return false;
        }
    }

    /**
     * Send Steam trade offer
     * @param {string} partnerSteamId - Buyer's Steam ID
     * @param {string} tradeToken - Buyer's trade token
     * @param {Array} itemsToGive - Items seller is giving
     * @param {string} message - Trade message
     * @returns {Promise<string|null>} - Trade offer ID or null
     */
    async sendTradeOffer(partnerSteamId, tradeToken, itemsToGive, message = '') {
        try {
            const url = `https://api.steampowered.com/IEconService/SendTradeOffer/v1/`;
            
            const tradeOfferData = {
                newversion: true,
                version: 4,
                me: {
                    assets: itemsToGive.map(item => ({
                        appid: 730,
                        contextid: "2",
                        amount: 1,
                        assetid: item.assetid
                    })),
                    currency: [],
                    ready: false
                },
                them: {
                    assets: [],
                    currency: [],
                    ready: false
                }
            };

            const params = {
                key: this.steamApiKey,
                trade_offer_access_token: tradeToken,
                steamid_target: partnerSteamId,
                trade_offer_create_params: JSON.stringify(tradeOfferData),
                trade_offer_message: message
            };

            const response = await this.client.post(url, null, { params });
            
            if (response.data.response && response.data.response.tradeofferid) {
                const tradeOfferId = response.data.response.tradeofferid;
                console.log(`Trade offer sent successfully: ${tradeOfferId}`);
                return tradeOfferId;
            }

            console.error('Failed to send trade offer:', response.data);
            return null;

        } catch (error) {
            console.error('Error sending trade offer:', error.message);
            return null;
        }
    }

    /**
     * Check trade offer status
     * @param {string} tradeOfferId - Trade offer ID
     * @returns {Promise<Object>} - Trade status object
     */
    async checkTradeStatus(tradeOfferId) {
        try {
            const url = `https://api.steampowered.com/IEconService/GetTradeOffer/v1/`;
            const params = {
                key: this.steamApiKey,
                tradeofferid: tradeOfferId,
                language: 'english'
            };

            const response = await this.client.get(url, { params });
            const offer = response.data.response?.offer;

            if (!offer) {
                return { status: 'not_found', offer: null };
            }

            // Trade offer states:
            // 1 = Invalid, 2 = Active, 3 = Accepted, 4 = Countered, 5 = Expired, 6 = Canceled, 7 = Declined, 8 = InvalidItems, 9 = CreatedNeedsConfirmation, 10 = CanceledBySecondFactor, 11 = InEscrow
            const stateMap = {
                1: 'invalid',
                2: 'active',
                3: 'accepted',
                4: 'countered',
                5: 'expired',
                6: 'canceled',
                7: 'declined',
                8: 'invalid_items',
                9: 'needs_confirmation',
                10: 'canceled_2fa',
                11: 'in_escrow'
            };

            const status = stateMap[offer.trade_offer_state] || 'unknown';
            
            return {
                status,
                offer,
                isCompleted: status === 'accepted',
                isFailed: ['expired', 'canceled', 'declined', 'invalid', 'invalid_items'].includes(status)
            };

        } catch (error) {
            console.error('Error checking trade status:', error.message);
            return { status: 'error', offer: null };
        }
    }

    /**
     * Monitor trade and update Solana contract
     * @param {number} tradeId - Internal trade ID
     * @param {string} steamTradeOfferId - Steam trade offer ID
     * @param {PublicKey} escrowAccount - Solana escrow account
     */
    async monitorTrade(tradeId, steamTradeOfferId, escrowAccount) {
        const maxAttempts = 120; // 2 hours with 1-minute intervals
        let attempts = 0;

        const checkInterval = setInterval(async () => {
            attempts++;
            
            try {
                const tradeStatus = await this.checkTradeStatus(steamTradeOfferId);
                console.log(`Trade ${tradeId} status check ${attempts}/${maxAttempts}: ${tradeStatus.status}`);

                if (tradeStatus.isCompleted) {
                    // Trade completed successfully
                    clearInterval(checkInterval);
                    await this.confirmSteamTransferOnChain(
                        tradeId, 
                        escrowAccount, 
                        `https://steamcommunity.com/tradeoffer/${steamTradeOfferId}/`
                    );
                    
                } else if (tradeStatus.isFailed || attempts >= maxAttempts) {
                    // Trade failed or timed out
                    clearInterval(checkInterval);
                    console.log(`Trade ${tradeId} failed or timed out. Status: ${tradeStatus.status}`);
                    // Note: Solana contract will handle timeout refunds automatically
                }

            } catch (error) {
                console.error(`Error monitoring trade ${tradeId}:`, error.message);
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Verify Steam item and update contract
     * @param {number} tradeId - Internal trade ID
     * @param {string} sellerSteamId - Seller's Steam ID
     * @param {string} itemId - Steam item ID
     * @param {PublicKey} escrowAccount - Solana escrow account
     */
    async verifyAndUpdateContract(tradeId, sellerSteamId, itemId, escrowAccount) {
        try {
            // Verify item ownership
            const hasItem = await this.verifyItemOwnership(sellerSteamId, itemId);
            
            if (!hasItem) {
                console.log(`Item ${itemId} not found in seller's inventory`);
                return false;
            }

            // Update Solana contract
            const tx = await this.program.methods
                .verifySteamItem()
                .accounts({
                    escrow: escrowAccount,
                    backendAuthority: this.backendKeypair.publicKey,
                })
                .signers([this.backendKeypair])
                .rpc();

            console.log(`Steam item verified on-chain for trade ${tradeId}. TX: ${tx}`);
            return true;

        } catch (error) {
            console.error(`Error verifying Steam item for trade ${tradeId}:`, error.message);
            return false;
        }
    }

    /**
     * Confirm Steam transfer completion on Solana
     * @param {number} tradeId - Internal trade ID
     * @param {PublicKey} escrowAccount - Solana escrow account
     * @param {string} steamTradeUrl - Steam trade confirmation URL
     */
    async confirmSteamTransferOnChain(tradeId, escrowAccount, steamTradeUrl) {
        try {
            // Get escrow account data to find seller token account
            const escrowData = await this.program.account.tradeEscrow.fetch(escrowAccount);
            
            // Find seller's USDC token account (you'll need to implement this lookup)
            const sellerTokenAccount = await this.findUserTokenAccount(escrowData.seller);
            const escrowTokenAccount = await this.findEscrowTokenAccount(escrowAccount);

            const tx = await this.program.methods
                .confirmSteamTransfer(steamTradeUrl)
                .accounts({
                    escrow: escrowAccount,
                    escrowTokenAccount: escrowTokenAccount,
                    sellerTokenAccount: sellerTokenAccount,
                    backendAuthority: this.backendKeypair.publicKey,
                    tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
                })
                .signers([this.backendKeypair])
                .rpc();

            console.log(`Steam transfer confirmed on-chain for trade ${tradeId}. TX: ${tx}`);
            return tx;

        } catch (error) {
            console.error(`Error confirming Steam transfer for trade ${tradeId}:`, error.message);
            throw error;
        }
    }

    /**
     * Find user's USDC token account
     * @param {PublicKey} userPublicKey - User's Solana public key
     * @returns {Promise<PublicKey>} - Token account public key
     */
    async findUserTokenAccount(userPublicKey) {
        // Implementation depends on your token account structure
        // This is a simplified version - you may need to use getTokenAccountsByOwner
        const [tokenAccount] = await PublicKey.findProgramAddress(
            [
                userPublicKey.toBuffer(),
                new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v').toBuffer(), // USDC mint
            ],
            new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program
        );
        return tokenAccount;
    }

    /**
     * Find escrow's USDC token account
     * @param {PublicKey} escrowAccount - Escrow account public key
     * @returns {Promise<PublicKey>} - Token account public key
     */
    async findEscrowTokenAccount(escrowAccount) {
        const [tokenAccount] = await PublicKey.findProgramAddress(
            [
                escrowAccount.toBuffer(),
                new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
                new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v').toBuffer(), // USDC mint
            ],
            new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program
        );
        return tokenAccount;
    }

    /**
     * Handle complete trade flow
     * @param {Object} tradeData - Trade information
     */
    async handleTradeFlow(tradeData) {
        const { 
            tradeId, 
            escrowAccount, 
            sellerSteamId, 
            buyerSteamId, 
            buyerTradeToken, 
            itemId,
            itemAssetId 
        } = tradeData;

        try {
            console.log(`Starting trade flow for trade ${tradeId}`);

            // Step 1: Verify seller has the item
            const verified = await this.verifyAndUpdateContract(
                tradeId, 
                sellerSteamId, 
                itemId, 
                new PublicKey(escrowAccount)
            );

            if (!verified) {
                console.log(`Trade ${tradeId} failed verification`);
                return false;
            }

            // Step 2: Send Steam trade offer
            const steamTradeOfferId = await this.sendTradeOffer(
                buyerSteamId,
                buyerTradeToken,
                [{ assetid: itemAssetId }],
                `SteamPipe Trade #${tradeId} - Please accept to complete your purchase`
            );

            if (!steamTradeOfferId) {
                console.log(`Failed to send Steam trade offer for trade ${tradeId}`);
                return false;
            }

            // Step 3: Monitor trade completion
            await this.monitorTrade(tradeId, steamTradeOfferId, new PublicKey(escrowAccount));

            return true;

        } catch (error) {
            console.error(`Error in trade flow for trade ${tradeId}:`, error.message);
            return false;
        }
    }
}

module.exports = SteamTradeManager;
