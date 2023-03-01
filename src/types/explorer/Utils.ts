import { PublicKey } from "@solana/web3.js";

/**
 * Arguments for which time units to include in the human readable string.
 */
interface TimeRemainingOpts {
    days?: boolean;
    hours?: boolean;
    minutes?: boolean;
    seconds?: boolean;
}

/**
 * A function to get a human readable time remaining string.
 * 
 * @param until The time in milliseconds until the event
 * @param opts An object that specifies which time units to include in the string
 * @returns A human readable string
 */
export function getHumanTimeRemaining(until: number, opts?: TimeRemainingOpts): string {
  const timeRemaining = Math.abs(until - Date.now());

  const seconds = Math.floor((timeRemaining / 1000) % 60);
  const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

  if (opts) {
    const res : string[] = [];

    if (opts.days && days > 0) res.push(`${days} days`);
    if (opts.hours && hours > 0) res.push(`${hours} hours`);
    if (opts.minutes && minutes > 0) res.push(`${minutes} minutes`);
    if (opts.seconds && seconds > 0) res.push(`${seconds} seconds`);

    // join the res with commas, but the last one with "and"
    return res.join(", ").replace(/,([^,]*)$/, " and$1");
  }

  if (days > 0) return `${days} days`;
  if (hours > 0) return `${hours} hours`;
  if (minutes > 0) return `${minutes} minutes`;

  return `${seconds} seconds`;
}

/**
 * Takes a list and chunks it into smaller lists of size `size`.
 * 
 * @param list 
 * @param size 
 * @returns A list of lists
 */
export function chunk<T>(list: T[], size: number): T[][] {
  return list.reduce((acc, cur, i) => {
    const idx = Math.floor(i / size);
    acc[idx] = acc[idx] || [];
    acc[idx].push(cur);
    return acc;
  }, [] as T[][]);
}

/**
 * Shortens a signature to a given length.
 * 
 * @param sig 
 * @param len 
 * @returns A shortened signature
 */
export function shortenSignature(sig: string, len: number = 16): string {
  return `${sig.substring(0, len)}...${sig.substring(sig.length - len)}`;
}

/**
 * Shortens a public key to a given length.
 * 
 * @param pubkey 
 * @param len 
 * @returns A shortened public key
 */
export function shortenPubkey(pubkey: PublicKey, len: number = 6): string {
  const address = pubkey.toBase58();
  return `${address.substring(0, len)}...${address.substring(address.length - len)}`;
}