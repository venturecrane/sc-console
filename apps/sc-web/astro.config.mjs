// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'
import AstroPWA from '@vite-pwa/astro'

// https://astro.build/config
export default defineConfig({
  site: 'https://siliconcrane.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Silicon Crane',
        short_name: 'SC',
        description: 'Expert B2B software sprint execution',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111827',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: undefined,
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
