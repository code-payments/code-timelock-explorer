import { unpackAccount } from "@solana/spl-token";
import { AccountInfo, Keypair, PublicKey } from "@solana/web3.js";
import { Derive } from "../keyphrase/Derive";
import { CodeWalletData, getDerivationPath } from "./CodeWallet";
import { TrayAccountType } from "./Tray";
import { TimeLockAccount, TimeLockState } from "../program/timelock";
import { getTimelockStatePda, getTimelockVaultPda } from "./CodeWallet";

const ErrUnknownState = () => new Error("Unknown timelock account state");
const ErrInvalidOffset = () => new Error("Invalid offset for account type");

/**
 * Args for creating a new timelock account.
 */
interface TimelockArgs {
    owner: PublicKey;    // Parent account that derived this account
    authority: Keypair;  // Only the phone knows the private portion of the keypair.

    address: PublicKey;
    bump: number;
    vault: PublicKey;

    accountType: TrayAccountType;
    derivationIndex : number;
    derivationOffset : number;
}

/**
 * A helper class for managing Timelock accounts.
 * 
 * This class follows the derivation strategy used by the Code Wallet App. 
 * Specifically, there is both an owner and an authority. The owner is only used
 * to derive the keypair that is used to sign transactions. This allows the
 * owner to manage multiple seemingly unrelated public keys on the blockchain.
 * 
 * ```ts
 * const primary = await Timelock.derivePrimary(env);
 * const sending = await Timelock.deriveFrom(env, 42, TrayAccountType.Outgoing);
 * const bucket1 = await Timelock.deriveFrom(env, 0, TrayAccountType.Bucket, 0);
 * const bucket2 = await Timelock.deriveFrom(env, 0, TrayAccountType.Bucket, 10);
 * ```
 */
export class Timelock {
    owner: PublicKey;              // Parent account that derived this account
    authority: Keypair;            // The owner of the timelock account.

    address: PublicKey;            // The on-chain address of the timelock state account.
    bump: number;                  // The bump seed used to derive the address above.
    vault: PublicKey;              // The token account that holds the locked tokens.

    accountType: TrayAccountType;  // The type of account this is, this dictates how the authority is derived.
    derivationIndex : number;      // The index of the derivation path.
    derivationOffset : number;     // The offset of the derivation path.

    state?: TimeLockAccount;       // The on-chain state of the timelock account (if known)
    balance?: bigint;              // The balance of the timelock account (if known)

    /**
     * Create a new instance of a known timelock account. Use this when you know
     * the address of the timelock account and want to interact with it.
     */
    constructor(args: TimelockArgs) {
        this.owner = args.owner;
        this.address = args.address;
        this.bump = args.bump;
        this.vault = args.vault;
        this.authority = args.authority;
        this.accountType = args.accountType;
        this.derivationIndex = args.derivationIndex;
        this.derivationOffset = args.derivationOffset;
    }

    /**
     * Update the state of the timelock account using the on-chain data.
     * 
     * @param info AccountInfo<Buffer> received from the blockchain.
     * @returns The updated timelock account.
     */
    updateFromAccountInfo(info: AccountInfo<Buffer>) : Timelock {
        const [deserialized,_] = TimeLockAccount.fromAccountInfo(info)
        this.state = deserialized;
        return this;
    }

    /**
     * Update the balance of the timelock account using the on-chain data. 
     * 
     * @param info AccountInfo<Buffer> received from the blockchain.
     */
    updateBalance(info: AccountInfo<Buffer>) : Timelock {
        const tokenAccount = unpackAccount(this.getVault(), info)
        this.balance = tokenAccount.amount;
        return this;
    }

    /**
     * Get the PDA that holds the timelock state.
     * 
     * @returns PublicKey
     */
    getAddress() : PublicKey { return this.address; }

    /**
     * Get the secret owner of the timelock account.
     * 
     * @remarks This value won't appear on-chain
     * @returns PublicKey
     */
    getOwner() : PublicKey { return this.owner; }

    /**
     * Get the public key of the authority that can sign transactions for this
     * account. Only this public key can sign transactions to move tokens from
     * the vault associated with this account.
     * 
     * @returns PublicKey
     */
    getAuthority() : PublicKey { return this.authority.publicKey; }

    /**
     * Get the bump seed used to derive the address of the timelock account.
     * 
     * @returns number between 0 and 255
     */
    getBump() { return this.bump; }

    /**
     * Get the PDA of the token account that holds the locked tokens managed by
     * this timelock account.
     * 
     * @returns PublicKey
     */
    getVault() : PublicKey { return this.vault; }

    /**
     * Get the derivation index that was used to derive the authority
     * keypair.
     * 
     * @remarks This value won't appear on-chain
     * @returns The derivation path for this account.
     * @see getDerivationOffset
     */
    getDerivationIndex(): number { return this.derivationIndex; }

    /**
     * Get the derivation offset that was used to derive the authority
     * keypair.
     * 
     * @remarks This value won't appear on-chain
     * @returns The derivation path for this account.
     * @see getDerivationIndex
     */
    getDerivationOffset(): number { return this.derivationOffset; }

    /**
     * Get the account type that was used to derive the authority
     * keypair.
     * 
     * @remarks This value won't appear on-chain
     * @returns The type of account this is.
     */
    getAccountType() : TrayAccountType { return this.accountType; }

    /**
     * Get the last known token balance of the vault managed by this timelock
     * account.
     * 
     * @remarks This value can be updated using the updateBalance method.
     * @returns The token balance of the timelock account.
     * @throws ErrUnknownState if the balance is not known.
     * @see updateBalance
     */
    getCachedBalance() : bigint {
        if (this.balance == undefined) {
            throw ErrUnknownState();
        }

        return this.balance;
    }

    /**
     * Get the last known on-chain state of the timelock account.
     * 
     * @remarks This value can be updated using the updateFromAccountInfo method.
     * @returns The state of the timelock account.
     * @throws ErrUnknownState if the state is not known.
     * @see updateFromAccountInfo
     * @see TimeLockAccount
     */
    getCachedState() : TimeLockAccount {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }

        return this.state;
    }

    /**
     * Using the last known on-chain state, determine if the timelock account is
     * currently unlocked. 
     * 
     * A timelock account has multiple states, it is not boolean, so do not use
     * this method to determine check for other states.
     *
     * @returns True iff the timelock account is locked, false otherwise.
     * @remarks This value can be updated using the updateFromAccountInfo method.
     * @throws ErrUnknownState if the state is not known.
     * @see TimeLockState
     * @see isLocked
     * @see isWaiting
     */
    isUnlocked() : boolean {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }
        
        return this.state.vaultState == TimeLockState.Unlocked;
    }

    /**
     * Using the last known on-chain state, determine if the timelock account is
     * currently locked.
     * 
     * A timelock account has multiple states, it is not boolean, so do not use
     * this method to determine check for other states.
     * 
     * @returns True iff the timelock account is locked, false otherwise.
     * @remarks This value can be updated using the updateFromAccountInfo method.
     * @throws ErrUnknownState if the state is not known.
     * @see TimeLockState
     * @see isUnlocked
     * @see isWaiting
     */
    isLocked() : boolean {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }

        return this.state.vaultState == TimeLockState.Locked;
    }

    /**
     * Using the last known on-chain state, determine if the timelock account is
     * currently waiting for the timeout to expire.
     * 
     * If true, it means that the authority has requested an unlock on the
     * tokens managed by this timelock account and is waiting for the agreed
     * timeout to elapse.
     * 
     * @returns True iff the timelock account is waiting for the timeout to
     * expire, false otherwise.
     * @throws ErrUnknownState if the state is not known.
     */
    isWaiting() : boolean {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }

        return this.state.vaultState == TimeLockState.WaitingForTimeout;
    }

    /**
     * Using the last known on-chain state, determine if the timelock account is
     * currently waiting for the timeout to expire AND the timeout has elapsed. 
     * 
     * An account in this state can be unlocked immediately. The tokens can be
     * moved right away.
     * 
     * @returns True iff the timelock account is waiting for the timeout to
     * expire AND the timeout has elapsed.
     * @throws ErrUnknownState if the state is not known.
     */
    canDeactivateLock() : boolean {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }

        return this.state.vaultState == TimeLockState.WaitingForTimeout && 
            this.getUnlockAtTime() < Date.now();
    }

    /**
     * Using the last known on-chain state, determine when the timelock account
     * will be unlockable.
     * 
     * @returns The timestamp in milliseconds when the timelock account will be
     * unlockable.
     * @throws ErrUnknownState if the state is not known.
     */
    getUnlockAtTime() : number {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }

        if (this.state.vaultState == TimeLockState.WaitingForTimeout) {
            return Number(this.state.unlockAt) * 1000;
        }
        if (this.state.vaultState == TimeLockState.Locked) {
            return this.state.numDaysLocked * 24 * 60 * 60 * 1000 + Date.now();
        }
        return 0;
    }

    /**
     * Using the last known on-chain state, determine how many milliseconds
     * remain until the timelock account is unlockable.
     * 
     * @returns The number of milliseconds remaining until the timelock account
     * @throws ErrUnknownState if the state is not known.
     */
    getRemainingTimeUntilUnlock() : number {
        if (this.state == undefined) {
            throw ErrUnknownState();
        }

        return this.getUnlockAtTime() - Date.now();
    }

    /**
     * Using the Code Wallet App derivation strategy for the given account type,
     * derive an authority keypair and its associated timelock account for the
     * given index and offset.
     * 
     * @param env The Code Wallet App configuration.
     * @param index The index of the account.
     * @param accountType The type of account to derive.
     * @param offset The offset of the account.
     * 
     * @returns A promise that resolves to a timelock account.
     * @throws ErrInvalidOffset if the offset is invalid for the given account
     * type.
     * 
     * @see deriveFrom
     * @see TrayAccountType
     * @see getKeypairForAccountType
     * @see getTimelockStatePda
     * @see getTimelockVaultPda
     */
    static async deriveFrom(
        env: CodeWalletData,
        index: number,
        accountType : TrayAccountType = TrayAccountType.Unknown,
        offset: number = 0,
        ) : Promise<Timelock> {

        // Primary accounts are handled slightly differently.
        if (accountType == TrayAccountType.Primary) {
            return Timelock.derivePrimary(env);
        }

        if (accountType == TrayAccountType.Bucket && offset == 0) {
            throw ErrInvalidOffset();
        }

        const owner = getKeypairForAccountType(TrayAccountType.Primary, index, env.keyphrase);
        const authority = getKeypairForAccountType(accountType, index, env.keyphrase, offset);

        const [address, bump] = await getTimelockStatePda(
            env.mint,
            env.timeAuthority,
            authority.publicKey,
            env.unlockDuration
        );

        const [vault] = await getTimelockVaultPda(address);

        return new Timelock({ 
            authority,
            address,
            bump,
            vault,
            accountType,
            owner: owner.publicKey, 
            derivationIndex: index,
            derivationOffset: offset,
        });
    }

    /**
     * Using the Code Wallet App derivation strategy for the primary account,
     * derive an authority keypair and its associated timelock account.
     * 
     * @param env The Code Wallet App configuration.
     * @returns A promise that resolves to a timelock account.
     * 
     * @see deriveFrom
     * @see getOwnerKeypair
     * @see getTimelockStatePda
     * @see getTimelockVaultPda
     */
    static async derivePrimary(
        env: CodeWalletData,
    ) : Promise<Timelock> {

        const keypair = getOwnerKeypair(env.keyphrase);
        const authority = keypair;

        const [address, bump] = await getTimelockStatePda(
            env.mint,
            env.timeAuthority,
            authority.publicKey,
            env.unlockDuration
        );

        const [vault] = await getTimelockVaultPda(address);

        return new Timelock({
            authority,
            address,
            bump,
            vault,
            owner: keypair.publicKey,
            accountType: TrayAccountType.Primary,
            derivationIndex: 0,
            derivationOffset: 0,
        });
    }
}

/**
 * Using the Code Wallet App derivation strategy, derive an owner keypair for
 * the given keyphrase. This method is used to derive the primary account
 * keypair. The primary account is the account that owns all other accounts.
 * 
 * @param keyphrase A 12 word english mnemonic.
 * @returns A keypair.
 * @see getKeypairForAccountType
 */
export function getOwnerKeypair(keyphrase: string) : Keypair {
    return getKeypairForAccountType(TrayAccountType.Primary, 0, keyphrase);
}

/**
 * Using the Code Wallet App derivation strategy, derive a keypair for the
 * given account type, index, and offset.
 * 
 * @param accountType The type of account to derive.
 * @param index The index of the account.
 * @param keyphrase The keyphrase to derive the keypair from.
 * @param offset The offset of the account.
 * @returns A keypair.
 */
export function getKeypairForAccountType(accountType: TrayAccountType, index: number, keyphrase: string, offset:number = 0) : Keypair {
   const path = getDerivationPath(accountType, index, offset);
   const descriptor = Derive.descriptorFromMnemonic(path, keyphrase);
   return descriptor.toKeypair();
}