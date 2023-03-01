<script lang="ts">
import { Ref, ref, defineComponent } from 'vue';

import { 
  PageHome,
  PageAccountList,
  PageAccountSearch,
  PageAccessKey,
  PageFeePayer,
  PageGetSignatures,
} from '../src/components';

import {
  CodeWalletData,
  Timelock,
  Tray,
  getCodeWalletConfig,
  getProvider,
} from '../src/types';

enum AppState {
  Landing,
  EnterAccessKey,
  SearchingForAccounts,
  AccountList,
  FeePage,
  GetSignatures,
}

const appState = ref(AppState.Landing);

async function update(accounts: Timelock[]): Promise<void> {
    const { connection, commitment } = getProvider();

    const addresses = [
        ...accounts.map(a => a.getAddress()),
        ...accounts.map(a => a.getVault()),
    ];

    const res = await connection().getMultipleAccountsInfo(addresses, commitment);

    for (let i = 0; i < res.length / 2; i++) {
        const stateInfo = res[i];
        const tokenInfo = res[accounts.length + i];
        if (stateInfo !== null && tokenInfo !== null) {
            const timelock = accounts[i];
            timelock.updateFromAccountInfo(stateInfo);
            timelock.updateBalance(tokenInfo);
        }
    }
}

export default defineComponent({
  components:{
    PageHome,
    PageAccountList,
    PageAccountSearch,
    PageAccessKey,
    PageFeePayer,
    PageGetSignatures
  },

  setup() {
    const env : Ref<CodeWalletData | undefined> = ref();
    const tray : Ref<Tray | undefined> = ref();
    const found : Ref<Timelock[] | undefined> = ref();

    return {
      env,
      tray,
      found,
    };
  },

  mounted() {
    // TODO: maybe use a router instead?

    // Keeping it simple for now, until we
    // have more pages or more complex routing.
    const goto = (page: AppState) => {
      window.scrollTo(0, 0);
      history.pushState({}, '');
      appState.value = page;
    }

    // Handle the back button
    window.addEventListener('popstate', (event) => {
      switch (appState.value) {
        case AppState.SearchingForAccounts:
          appState.value = AppState.EnterAccessKey;
          break;
        case AppState.AccountList:
          appState.value = AppState.EnterAccessKey;
          break;
        case AppState.GetSignatures:
          appState.value = AppState.FeePage;
          break;
        default:
          appState.value = AppState.Landing;
          break;
      }
    });

    this.$bus.on('goto:home', () => { goto(AppState.Landing); });
    this.$bus.on('goto:accesskey', () => { goto(AppState.EnterAccessKey) });
    this.$bus.on('goto:feepage', () => { goto(AppState.FeePage) });
    this.$bus.on('goto:getsignatures', () => { goto(AppState.GetSignatures) });

    this.$bus.on('goto:accountlist', (accounts: Timelock[] | undefined, refresh: boolean = true) => {
      if (accounts != undefined) {
        this.found = accounts;
      }

      if (this.found && refresh) {
        update(this.found);
      }

      goto(AppState.AccountList)
    });

    this.$bus.on('goto:search', (accessKey: string) => {
      goto(AppState.SearchingForAccounts)

      // Browsers don't like it when you do a lot of stuff in the same tick.  So
      // we wait a bit before initializing the tray.
      setTimeout(() => {
        const env = getCodeWalletConfig(accessKey);
        const tray = new Tray(env);

        tray.initialize().then((all) => {
          this.env = env;
          this.tray = tray;
        });
      }, 1000);
    });
  },

  methods: {
    activePage() {
      switch (appState.value) {
        case AppState.Landing:
          return PageHome;
        case AppState.AccountList:
          return PageAccountList;
        case AppState.EnterAccessKey:
          return PageAccessKey;
        case AppState.SearchingForAccounts:
          return PageAccountSearch;
        case AppState.FeePage:
          return PageFeePayer;
        case AppState.GetSignatures:
          return PageGetSignatures;
        default:
          return PageHome;
      }
    }
  }
});
</script>

<template>
  <transition mode="out-in">
    <component :is="activePage()" :tray="tray" :found="found" />
  </transition>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>

