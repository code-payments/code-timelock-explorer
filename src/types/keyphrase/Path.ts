const InvalidPathIdentifier = (identifier: string | undefined) => new Error(`Invalid path identifier: ${identifier}`)
const InvalidIndex = (index: string | undefined) => new Error(`Invalid index: ${index}`)

export class Index {
    static readonly hardenOffset = 0x80000000;
    static readonly maxIndex = 0x7fffffff;

    value: number;
    hardened: boolean;

    constructor(value: number, hardened: boolean) {
        this.value = value;
        this.hardened = hardened;
    }

    static fromNumber(value: number) : Index {
        return new Index(value, false);
    }

    static fromHardenedNumber(value: number) : Index {
        return new Index(value, true);
    }

    isValid() : boolean {
        return this.value >= 0 && this.value <= Index.maxIndex;
    }

    toBuffer() : Buffer {
        let value = this.value;
        if (this.hardened) {
            value += Index.hardenOffset;
        }

        return Buffer.from([
            (value >> 24) & 0xff,
            (value >> 16) & 0xff,
            (value >> 8) & 0xff,
            (value) & 0xff,
        ]);
    }
}

export class Path {
    static readonly identifier = "m";
    static readonly separator = "/";
    static readonly hardener = "'";

    indexes: Index[];

    constructor(path: string) {
        this.indexes = Path.parse(path);
    }

    static parse(path: string): Index[] {
        const components = path.split(Path.separator);

        const identifier = components.shift();
        if (identifier !== Path.identifier) {
            throw InvalidPathIdentifier(identifier);
        }

        const indexes = components.map((index) => {
            const hardened = index.endsWith(Path.hardener);
            const value = hardened ? index.slice(0, -1) : index;
            const parsed = parseInt(value, 10);

            if (isNaN(parsed) || parsed < 0 || parsed > Index.maxIndex) {
                throw InvalidIndex(index);
            }

            return new Index(parsed, hardened);
        });
        return indexes;
    }

    static stringify(indexes: Index[]): string {
        if (indexes.length === 0) {
            return Path.identifier;
        }

        return Path.identifier + this.separator + indexes.map((index) => {
            return index.value + (index.hardened ? Path.hardener : "");
        }).join(Path.separator);
    }

    toString(): string {
        return Path.stringify(this.indexes);
    }
}
