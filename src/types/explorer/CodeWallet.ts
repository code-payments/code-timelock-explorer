import { PublicKey } from "@solana/web3.js";
import { DefaultPath, Path } from "../keyphrase";
import { DataVersion, PROGRAM_ID } from "../program/timelock";
import { getConfig } from "./Provider";
import { TrayAccountType } from "./Tray";

// Code Wallet Config
export const CodeDefaultPath    = DefaultPath;
export const CodeTimeAuthority  = new PublicKey("codeHy87wGD5oMRLG75qKqsSi1vWE3oxNyYmXo5F9YR");
export const CodeUnlockDuration = 21; // 21 days

// Tray parameters
const bucketCount = 7;
const bucketIncrement = 10;

// PDA parameters (do not change)
const version = DataVersion.Version1,
  prefixTimelock = "timelock_state",
  prefixVault = "timelock_vault";

// Encoded versions of the above constants
const versionUint8 = new Uint8Array([version]);

/**
 * PDA params for the Code Wallet app.
 */
export interface PdaOptions {
  defaultPath: string;
  unlockDuration: number;
  timeAuthority: PublicKey;
  mint: PublicKey;
} 

/*
 * Environment variables needed to generate correct PDA addresses for the Code
 * Wallet app.
 */
export interface CodeWalletData extends PdaOptions {
  keyphrase: string;
  bucketCount: number;
  bucketIncrement: number;
}

/**
 * Given a keyphrase, return the configuration for the Code Wallet App.
 * 
 * @param keyphrase a keyphrase to use for the Code Wallet App
 * @returns A CodeAppConfig object
 */
export function getCodeWalletConfig(keyphrase: string): CodeWalletData {
  const { mint, timeAuthority, unlockDuration, defaultPath} = getConfig().value;

  return {
    mint,
    defaultPath,
    timeAuthority,
    keyphrase,
    unlockDuration,
    bucketCount,
    bucketIncrement,
  };
}

/**
 * Get the PDA address for the timelock state account.
 * 
 * @param mint The mint address for the token
 * @param timeAuthority The time authority for the timelock. A signature from
 * this address can allow for tokens to be moved immediately, otherwise the timelock
 * duration must pass.
 * @param owner The owner of the timelock and the tokens. Only a signature from
 * this address can move the tokens.
 * @param unlockDuration The duration in days that the timelock takes to unlock
 * @returns the PDA address for the timelock state account and the bump
 */
export async function getTimelockStatePda(mint: PublicKey, timeAuthority: PublicKey, owner: PublicKey, unlockDuration: number): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(prefixTimelock),
      mint.toBuffer(),
      timeAuthority.toBuffer(),
      owner.toBuffer(),
      new Uint8Array([unlockDuration]),
    ],
    PROGRAM_ID
  )
}

/**
 * Get the PDA address for the associated timelock token account. This is the
 * account that holds the tokens owned by the timelock.
 * 
 * @param timelock The timelock state account address
 * @returns The PDA address for the timelock token account and the bump
 */
export async function getTimelockVaultPda(timelock: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from(prefixVault),
      timelock.toBuffer(),
      versionUint8,
    ],
    PROGRAM_ID
  )
}

/**
 * Uses the Code Wallet App derivation strategy to generate a derivation path
 * for a given account type, index, and offset.
 * 
 * @param accountType The account type
 * @param index The index
 * @param offset The offset
 * @returns 
 */
export function getDerivationPath(accountType: TrayAccountType, index: number, offset: number = 0) : Path {
    switch (accountType) {
        case TrayAccountType.Primary:
            return CodeDefaultPath;
        case TrayAccountType.Bucket:
            return new Path(`m/44'/501'/0'/0'/${index}'/${offset}'`);
        case TrayAccountType.Incoming:
            return new Path(`m/44'/501'/0'/0'/${index}'/2'`);
        case TrayAccountType.Outgoing:
            return new Path(`m/44'/501'/0'/0'/${index}'/3'`);
        default:
            throw new Error(`Unknown account type: ${accountType}`);
    }
}