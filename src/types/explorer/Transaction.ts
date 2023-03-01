import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import { Timelock } from "./Timelock";
import { Tray } from "./Tray";
import { getProvider, getWallet } from "./Provider";
import * as program from "../program/timelock";

/**
 * Create a transaction to create an associated token account for a given tray.
 * This token account needs to be created before calling signWithdrawTx.
 * 
 * @param tray A tray object
 * @returns a promise for the transaction
 */
export async function signCreateAtaTx(tray: Tray): Promise<Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const ix = [
    createAssociatedTokenAccountIdempotentInstruction(
      feePayer,
      tray.getAssociatedTokenAddress(),
      tray.getOwner(),
      tray.getMint(),
    ),
  ];

  const bh = await connection().getRecentBlockhash();
  const tx = new Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;

  return await signTransaction(tx);
}


/**
 * Create a transaction to request an unlock for a given set of timelock
 * accounts. This transaction will fail if the timelock accounts are already
 * unlocked.
 * 
 * @remarks Once the transaction is submitted, the timelock accounts will be in
 * a waiting state. Once the timeout duration has elapsed, the timelock accounts
 * must be unlocked before they can be withdrawn.
 * 
 * @param accounts A list of timelock accounts
 * @returns a promise for the transaction
 * @see signWithdrawTx
 */
export async function signUnlockTx(accounts: Timelock[]) : Promise<Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const ix : TransactionInstruction[] = [];
  for (const account of accounts) {
    ix.push(
      program.createRevokeLockWithTimeoutInstruction(
        {
          timelock: account.getAddress(),
          vault: account.getVault(),
          vaultOwner: account.getAuthority(),
          payer: feePayer,
        },
        {
          timelockBump: account.getBump(),
        }
      )
    )
  }

  const bh = await connection().getRecentBlockhash();
  const tx = new Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;
  tx.partialSign(...accounts.map((a) => a.authority))

  // Add the payee signature and submit the transaction
  return await signTransaction(tx);
}

/**
 * Create a transaction to unlock and withdraw tokens from a given set of timelock
 * accounts. The accounts must be in a waiting state and the timelock duration
 * must have elapsed.
 * 
 * @remarks Once the transaction is submitted, the timelock accounts will be in
 * unlocked state. The tokens will be moved to the associated token account for
 * the tray.
 * 
 * @param tray A tray object
 * @param accounts A list of timelock accounts
 * @returns A promise for the transaction
 * @see signUnlockTx
 */
export async function signWithdrawTx(tray: Tray, accounts: Timelock[]) : Promise<Transaction> {
  const { connection } = getProvider();
  const { feePayer, signTransaction } = getWallet();

  const ix : TransactionInstruction[] = [];
  for (const account of accounts) {
    ix.push(
      program.createDeactivateInstruction(
        {
          timelock: account.getAddress(),
          vaultOwner: account.getAuthority(),
          payer: feePayer,
        },
        {
          timelockBump: account.getBump(),
        }
      ),
      program.createWithdrawInstruction(
        {
          timelock: account.getAddress(),
          vault: account.getVault(),
          vaultOwner: account.getAuthority(),
          destination: tray.getAssociatedTokenAddress(),
          payer: feePayer,
        },
        {
          timelockBump: account.getBump(),
        }
      )

    )
  }

  const bh = await connection().getRecentBlockhash();
  const tx = new Transaction();
  tx.add(...ix);
  tx.feePayer = feePayer;
  tx.recentBlockhash = bh.blockhash;
  tx.partialSign(...accounts.map((a) => a.authority))

  return await signTransaction(tx);
}