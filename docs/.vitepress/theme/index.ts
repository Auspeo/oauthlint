import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource-variable/sora/wght.css';
import '@fontsource-variable/martian-mono/wght.css';
import Home from './Home.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeLanding', Home);
  },
} satisfies Theme;
