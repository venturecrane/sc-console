// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://siliconcrane.com',
  output: 'static', // Static by default, opt-in to SSR with prerender: false
  adapter: cloudflare(),
  integrations: [tailwind()],
});
