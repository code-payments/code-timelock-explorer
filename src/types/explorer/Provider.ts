import { SignerWalletAdapterProps, WalletAdapterProps } from "@solana/wallet-adapter-base";
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import { Ref, ref } from "vue";
import { useWallet } from "solana-wallets-vue";
import * as codeApp from './CodeWallet';
import * as kin from './Kin';

const ErrProviderNotInitialized = () => new Error("Provider not initialized");
const ErrWalletNotConnected = () => new Error("Wallet not connected");

const defaultUrl        = "http://localhost:8899";
const savedRpcUrl       = localStorage.getItem("rpcUrl")

export interface Provider {
  connection: () => Connection;
  commitment: Commitment;
}

export interface Wallet {
  feePayer: PublicKey;
  sendTransaction: WalletAdapterProps["sendTransaction"];
  signTransaction: SignerWalletAdapterProps["signTransaction"];
}

export interface RpcOptions {
  rpcUrl: string;
  commitment: Commitment;
}

export type Options = RpcOptions & codeApp.PdaOptions;
let config: Ref<Options>;

const defaults: Options = {
  commitment:     "confirmed",
  rpcUrl:         savedRpcUrl || defaultUrl,
  defaultPath:    codeApp.CodeDefaultPath.toString(),
  unlockDuration: codeApp.CodeUnlockDuration,
  timeAuthority:  codeApp.CodeTimeAuthority,
  mint:           kin.Mint,
}

export function initConfig(opts: Partial<Options> = {} as Partial<Options>) {
  // If the user has already set a custom rpcUrl, don't override it with the
  // default
  if (opts.rpcUrl && opts.rpcUrl === defaultUrl) {
    opts.rpcUrl = defaults.rpcUrl;
  }

  config = ref({ ...defaults, ...opts, });
}

export function getConfig() {
  if (!config) {
    throw ErrProviderNotInitialized;
  }
  return config;
}

export function getProvider() {
  const { rpcUrl, commitment } = getConfig().value;
  const connection = () => new Connection(rpcUrl, commitment);

  return {
    connection,
    commitment,
  }
}

export function getWallet() {
  const wallet = useWallet();

  if (!wallet.publicKey.value) {
    throw ErrWalletNotConnected();
  }

  if (!wallet.signTransaction.value) {
    throw ErrWalletNotConnected();
  }

  const sendTransaction = wallet.sendTransaction;
  const signTransaction = wallet.signTransaction.value;
  const feePayer: PublicKey = wallet.publicKey.value;

  return {
    feePayer,
    sendTransaction,
    signTransaction
  }
}
