# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Code Timelock Explorer is a Vue 3 + TypeScript web application (also packaged as a library) for unlocking Solana Timelock Accounts created by the Code Wallet App. Users enter their Access Key (mnemonic), the app derives timelock accounts, and allows unlocking/transferring funds to another Solana wallet.

Live deployment: https://code-payments.github.io/code-timelock-explorer/

## Build & Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (Vite)
npm run build            # Build both library and app
npm run build:lib        # Build library only (UMD + ESM + type declarations)
npm run build:app        # Build standalone app only (to timelock-explorer/)
npm run preview          # Preview built app
```

No test suite or linter is configured.

## Architecture

**Dual build targets** via two Vite configs:
- `vite.config.ts` — Library build, entry at `src/index.ts`, outputs to `dist/`
- `vite.timelock-explorer.config.ts` — App build, root at `timelock-explorer/`, outputs to `timelock-explorer/` with base path `/code-timelock-explorer/`

**Key directories:**
- `src/types/` — All business logic, crypto, and Solana interaction (no Vue dependencies)
- `src/components/` — Vue components organized as elements, sections, pages, dialogs
- `timelock-explorer/` — App shell (App.vue, index.html, entry point)

**State management:** Custom `EventEmitter` pub/sub pattern (no Vuex/Pinia). App.vue acts as the state coordinator using an `AppState` enum that drives a manual page-based state machine:
`Home → AccessKey → AccountSearch → AccountList → FeePayer → GetSignatures`

**Core business logic in `src/types/`:**
- `explorer/Timelock.ts` — Individual timelock account management, state checking, unlock time calculation
- `explorer/Tray.ts` — Collection of timelock accounts owned by one Access Key (primary, buckets, incoming, outgoing)
- `explorer/CodeWallet.ts` — Code Wallet config, PDA generation, constants (TimeAuthority, 21-day unlock duration, Kin mint)
- `keyphrase/Derive.ts` — SLIP-0010 ED25519 deterministic key derivation from mnemonics
- `program/timelock/generated/` — Auto-generated Solana program types from IDL (`program/idl/timelock_token.json`)

**Styling:** Tailwind CSS with dark mode (class-based), Headless UI components, Inter + Lexend fonts.

**Path alias:** `@/*` maps to `./src/*`

## Key Dependencies

- Solana: `@solana/web3.js`, `@solana/spl-token`, wallet adapters via `solana-wallets-vue`
- Crypto: `@noble/ed25519`, `@noble/hashes`
- Node polyfills required in browser: crypto, process, stream, zlib (configured in both Vite configs)
