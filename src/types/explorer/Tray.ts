import { PublicKey } from "@solana/web3.js";
import { CodeWalletData } from "./CodeWallet";
import { Timelock } from "./Timelock";
import { getAssociatedTokenAddress } from "@solana/spl-token"

/**
 * TrayAccountType is used to derive the correct account type for a given
 * account address.
 * 
 * @remarks The derivations used are the same ones used by the Code Wallet App.
 */
export enum TrayAccountType {
    Unknown = 0,
    Primary,
    Incoming,
    Outgoing,
    Bucket,
}

/**
 * The Tray class represents the state of a Code Wallet Tray. It is used to
 * derive the addresses of all the accounts are owned by an Access Code.
 * 
 * @remarks The derivations used are the same ones used by the Code Wallet App.
 */
export class Tray {
    env: CodeWalletData;

    // Any time a payment is made, the incoming and outgoing indexes are
    // incremented. When combined with the owner keypair, a new address can be
    // created that is not known to the public and can't be guessed ahead of
    // time.
    incomingIndex: number;
    outgoingIndex: number;

    // The primary account used for deposits into the tray.
    primary?: Timelock;

    // The buckets are used to store denominations of tokens. The buckets are
    // used to make it easier to send a specific denomination of tokens.
    buckets: Timelock[];

    // The incoming and outgoing accounts are used to make or receive payments.
    incoming: Timelock[];
    outgoing: Timelock[];

    // The associated token account is used to hold the tokens that are
    // unlocked.
    ata: PublicKey;

    /**
     * Creates a new Tray instance.
     * 
     * @param env The CodeWalletData for the tray
     */
    constructor(env: CodeWalletData) {
        this.env = env;
        this.incomingIndex = 0;
        this.outgoingIndex = 0;

        this.buckets = [];
        this.incoming = [];
        this.outgoing = [];
        this.ata = PublicKey.default;
    }

    /**
     * Checks if the tray has been initialized.
     * 
     * @returns True if the tray has been initialized, false otherwise.
     */
    isInitialized() : boolean { 
        return this.primary != undefined && 
            this.buckets.length > 0 && 
            this.incoming.length > 0 && 
            this.outgoing.length > 0;
    }

    /**
     * Initializes the tray using the given incoming and outgoing indexes.
     * 
     * @remarks This method is will derive an initial set of addresses
     * @param lastIncoming The last incoming index
     * @param lastOutgoing The last outgoing index
     */
    async initialize(lastIncoming: number = 0, lastOutgoing: number = 0) : Promise<Timelock[]> {
        const env = this.getEnvironment();

        this.primary = await Timelock.derivePrimary(env);
        this.ata = await getAssociatedTokenAddress(env.mint, this.primary.getOwner());

        for (let i = 0; i < env.bucketCount; i++) {
            this.buckets.push(
                await Timelock.deriveFrom(
                    env, 0, TrayAccountType.Bucket,
                    env.bucketIncrement ** i)
                );
        }

        this.incomingIndex = lastIncoming;
        this.outgoingIndex = lastOutgoing;

        this.incoming.push(await Timelock.deriveFrom(env, this.incomingIndex, TrayAccountType.Incoming));
        this.outgoing.push(await Timelock.deriveFrom(env, this.outgoingIndex, TrayAccountType.Outgoing));

        return this.getAllAccounts();
    }

    /**
     * Gets the current CodeWalletData for the tray.
     */
    getEnvironment() : CodeWalletData {
        return this.env;
    }

    /**
     * Gets the owner public key for the tray.
     */
    getOwner() : PublicKey {
        if (!this.isInitialized()) {
            throw new Error("State is not initialized");
        }

        return this.primary!.getOwner();
    }

    /**
     * Gets the associated token address for the tray. This is the destination
     * that will receive unlocked tokens.
     */
    getAssociatedTokenAddress() : PublicKey {
        if (!this.isInitialized()) {
            throw new Error("State is not initialized");
        }

        return this.ata;
    }

    /**
     * Get the mint address used when deriving the associated token address and
     * timelock PDAs.
     */
    getMint() : PublicKey {
        return this.env.mint;
    }

    /**
     * 
     * Convenience method to derive Timelock accounts for different types of
     * accounts at a provided index and offset.
     * 
     * @param accountType 
     * @param index 
     * @param offset 
     * @returns A Timelock instance
     */
    async getAccountByIndex(accountType: TrayAccountType, index: number, offset: number = 0) : Promise<Timelock> {
        return await Timelock.deriveFrom(this.env, index, accountType, offset);
    }

    /**
     * Get all initialized accounts for the tray.
     * 
     * @remarks This method will throw an error if the tray has not been
     * initialized. Also, note that the returned addresses have not been
     * validated against the blockchain. They may or may not exist.
     * 
     * @returns An array of Timelock instances
     */
    getAllAccounts() : Timelock[] {
        if (!this.isInitialized()) {
            throw new Error("State is not initialized");
        }
        return [
            this.primary!,
            ...this.buckets,
            ...this.incoming,
            ...this.outgoing,
        ];
    }
}
