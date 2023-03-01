import crypto from "crypto";
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { Keypair } from "@solana/web3.js";
import { Index, Path } from './Path';

// Deterministic wallet generation for ED25519 curve using SLIP-0010 spec
// Reference: https://github.com/satoshilabs/slips/blob/master/slip-0010.md

export class KeyDescriptor {
    key: Uint8Array;
    chain: Uint8Array;

    constructor(key: Uint8Array, chain: Uint8Array) {
        this.key = key;
        this.chain = chain;
    }

    toKeypair(): Keypair {
        return Keypair.fromSeed(this.key);
    }
}

export class Derive {

    static readonly curve = Buffer.from("ed25519 seed")

    static masterKey(seed: Buffer): KeyDescriptor {
        const I = hmac(sha512, Derive.curve, seed);

        return new KeyDescriptor(
            I.slice(0, 32),
            I.slice(32),
        );
    }

    static path(seed: Buffer, path: Path): KeyDescriptor {
        var descriptor = Derive.masterKey(seed);

        for (const index of path.indexes) {
            descriptor = Derive.childKey(descriptor, index);
        }

        return descriptor;
    }

    static childKey(descriptor: KeyDescriptor, index: Index): KeyDescriptor {
        const data = Buffer.from([
            0x00,
            ...descriptor.key,
            ...index.toBuffer(),
        ]);

        const I = hmac(sha512, descriptor.chain, data);

        return new KeyDescriptor(
            I.slice(0, 32),
            I.slice(32),
        );
    }

    static descriptorFromMnemonic(path: Path, phrase: string, password: string = ""): KeyDescriptor {
        const seed = Derive.seedFromMnemonic(phrase, password);
        return Derive.path(seed, path);
    }

    static seedFromMnemonic(phrase: string, password: string) : Buffer {
        const salt = "mnemonic" + password;
        return crypto.pbkdf2Sync(phrase, salt, 2048, 64, 'sha512');
    }
}