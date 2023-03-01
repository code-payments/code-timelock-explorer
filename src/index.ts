import { App } from 'vue';
import type { Options } from './types';
import { initConfig, getConfig, EventEmitter } from './types';

export * from './components';
export * from './types';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $bus: EventEmitter;
  }
}

export default {
    install: (app: App, options: Options) => {
        initConfig(options);
        app.config.globalProperties.$config = getConfig();
        app.config.globalProperties.$bus = new EventEmitter();;
    }
};