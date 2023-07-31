import { PublicKey } from "@solana/web3.js"
import { Timelock } from "./Timelock";

const decimals     = 5; 			        // 5 decimal places for Kin
const quarksPerKin = 10 ** decimals;        // 100,000 quarks per Kin

/**
 * The mint address for the Kin token.
 */
export const Mint  = new PublicKey("kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6")

/**
 * Convert a given quantity of Quarks to Kin.
 * 
 * @param quarks Number of quarks to convert
 * @returns Amount of Kin
 * @throws If the given amount of Quarks is not a valid number
 */
export function FromQuarks(quarks: number) : number {
	// For now, we can use simple division here because we know that the total
	// supply of Quarks and the number of decimals allows for this.

	// TODO: perhaps we should use a BigInt or strings here to avoid precision
	// and rounding errors?

	if (quarks === 0) { return 0; }

	if (Number.isNaN(quarks)) {
		throw new Error("Quark amount is not a number");
	}

	if (!Number.isFinite(quarks)) {
		throw new Error("Quark amount is not a finite number");
	}

	if (!Number.isSafeInteger(quarks)) {
		throw new Error("Quark amount is not a safe integer");
	}

	if (quarks < 0) {
		throw new Error("Quark amount is negative");
	}

	if (quarks % 1 !== 0) {
		throw new Error("Quark amount is not a whole number");
	}

	return quarks / quarksPerKin;
}

/**
 * Convert a given quantity of Kin to Quarks.
 * 
 * @param kin Number of Kin to convert
 * @returns Amount of Quarks
 * @throws If the given amount of Kin is not a valid number
 */
export function ToQuarks(kin: number): number {
	// For now, we can use simple multiplication here because we know that the
	// total supply of Quarks and the number of decimals allows for this.

	// TODO: perhaps we should use a BigInt or strings here to avoid precision
	// and rounding errors?

	if (kin === 0) { return 0; }
	
	if (Number.isNaN(kin)) {
		throw new Error("Kin amount is not a number");
	}

	if (!Number.isFinite(kin)) {
		throw new Error("Kin amount is not a finite number");
	}

	if (!Number.isSafeInteger(kin)) {
		throw new Error("Kin amount is not a safe integer");
	}

	if (kin < 0) {
		throw new Error("Kin amount is negative");
	}

	if (kin % 1 !== 0) {
		throw new Error("Kin amount is not a whole number");
	}

	if (kin > Number.MAX_SAFE_INTEGER / quarksPerKin) {
		throw new Error("Kin amount is too large");
	}

	if (kin < Number.MIN_SAFE_INTEGER / quarksPerKin) {
		throw new Error("Kin amount is too small");
	}

	return kin * quarksPerKin;
}

/**
 * Using the last known on-chain state, determine the total Kin token balance of
 * the given accounts.
 * 
 * @param accounts 
 * @returns 
 */
export function getEstimatedTotalBalance(accounts: Timelock[]): number {
  return FromQuarks(
    accounts.reduce(
      (acc, account) => acc + Number(account.getCachedBalance()), 0));
}