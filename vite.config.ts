import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ["vue"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      crypto: 'crypto-browserify',
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
    },
  },
  define: {
    global: {},
    'process.env': {},
  },
  build: {
    chunkSizeWarningLimit: 1600,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "timelock-explorer",
    },
    rollupOptions: {
      external: [
        "@solana/wallet-adapter-base",
        "@solana/wallet-adapter-wallets",
        "@solana/web3.js",
        "@vueuse/core",
        "vue",
      ],
      output: {
        exports: "named",
        globals: {
          "@solana/wallet-adapter-base": "SolanaWalletAdapterBase",
          "@solana/wallet-adapter-wallets": "SolanaWalletAdapterWallets",
          "@solana/web3.js": "SolanaWeb3",
          "@vueuse/core": "VueUseCore",
          vue: "Vue",
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
})
