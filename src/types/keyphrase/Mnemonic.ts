import crypto from "crypto";

import { Keypair } from "@solana/web3.js";
import { Derive } from "./Derive";
import { getWords, MnemonicLanguage } from "./MnemonicWords";
import { Path } from "./Path";

const InvalidEntropyError = () => new Error('Invalid entropy');
const InvalidMnemonicError = () => new Error('Invalid mnemonic');

export const DefaultLanguage = MnemonicLanguage.English;
export const DefaultWordlist = getWords(DefaultLanguage);
export const DefaultPath     = new Path("m/44'/501'/0'/0'"); // Standard Solana path

// Deterministic wallet generation for ED25519 curve using SLIP-0010 spec
// Reference: https://github.com/satoshilabs/slips/blob/master/slip-0010.md

export enum MnemonicType {
    Short = 12,
    Long = 24,
}

export class Mnemonic {
    static toMnemonic(entropy: Uint8Array, wordList: string[] = DefaultWordlist): string {
        if (entropy.length < 16 || entropy.length > 32 || entropy.length % 4 !== 0) {
            throw InvalidEntropyError();
        }

        const entropyBits = bytesToBinary(Array.from(entropy));
        const checksumBits = deriveChecksumBits(entropy);
        const bits = entropyBits + checksumBits;
        const chunks = bits.match(/(.{1,11})/g);
        const phrase = chunks!.map((binary) => {
            const index = binaryToByte(binary);
            return wordList[index];
        });

        return phrase.join(" ");
    }

    static toEntropy(mnemonic: string, wordList: string[] = DefaultWordlist): Buffer {
        const phrase = mnemonic.split(/\s+/g);

        if (phrase.length < 12 || phrase.length > 24 || phrase.length % 3 !== 0) {
            throw InvalidMnemonicError();
        }

        // convert word indices to 11 bit binary strings
        const bits = phrase.map((word) => {
            const index = wordList.indexOf(word);
            if (index === -1) {
                throw InvalidMnemonicError();
            }
            return lpad(index.toString(2), '0', 11);
        }).join('');

        // split the binary string into ENT/CS
        const dividerIndex = Math.floor(bits.length / 33) * 32;
        const entropyBits = bits.slice(0, dividerIndex);
        const checksumBits = bits.slice(dividerIndex);

        // calculate the checksum and compare
        const entropyBytes = entropyBits!.match(/(.{1,8})/g)!.map(binaryToByte);
        const entropy = Buffer.from(entropyBytes);

        if (entropy.length < 16 || entropy.length > 32 || entropy.length % 4 !== 0) {
            throw InvalidEntropyError();
        }

        const newChecksum = deriveChecksumBits(entropy);
        if (newChecksum !== checksumBits) {
            throw InvalidMnemonicError();
        }

        return entropy;
    }

}

export class MnemonicPhrase {
    phrase: string;
    words: string[];
    kind: MnemonicType;

    constructor(phrase: string) {
        this.phrase = phrase;
        this.words = phrase.split(' ');

        const numWords = this.words.length;
        if (numWords == 12) {
            this.kind = MnemonicType.Short;
        } else if (numWords == 24) {
            this.kind = MnemonicType.Long;
        } else {
            throw new Error(`Invalid number of words: ${numWords}`);
        }
    }

    public getPhrase(): string {
        return this.phrase;
    }

    public getWords(): string[] {
        return this.words;
    }

    toKeypair(path: Path = DefaultPath): Keypair {
        return Derive.descriptorFromMnemonic(path, this.phrase).toKeypair();
    }

    static generate(kind: MnemonicType = MnemonicType.Short, language: MnemonicLanguage = MnemonicLanguage.English): MnemonicPhrase {
        const strength = kind == MnemonicType.Short ? 128 : 256;
        const length = strength / 8;
        const entropy = crypto.randomBytes(length);
        const phrase = Mnemonic.toMnemonic(entropy, getWords(language));
        return new MnemonicPhrase(phrase);
    }

    static isValid(phrase: string): boolean {
        const words = phrase.trim()
        if (!words.match(/^[a-z\s]+$/)) {
            return false;
        }
        if (words.split(/\s+/).length != 12) {
            return false;
        }

        return true;
    }
}


function lpad(str: string, padString: string, length: number): string {
    while (str.length < length) {
        str = padString + str;
    }
    return str;
}

function binaryToByte(bin: string) {
    return parseInt(bin, 2);
}

function bytesToBinary(bytes: number[]): string {
    return bytes.map((x) => lpad(x.toString(2), '0', 8)).join('');
}

function deriveChecksumBits(data: Uint8Array): string {
    const ENT = data.length * 8;
    const CS = ENT / 32;
    const hash = crypto.createHash('sha256').update(data).digest()
    return bytesToBinary(Array.from(hash)).slice(0, CS);
}
