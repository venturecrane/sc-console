// @ts-check
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'
import clerk from '@clerk/astro'
import AstroPWA from '@vite-pwa/astro'

// https://astro.build/config
//
// Output: 'server' (SSR). Marketing pages opt back into prerender via
// `export const prerender = true` in their frontmatter. Clerk-gated routes
// (/sign-in, /app/*) are dynamic and require SSR.
//
// Adapter: Cloudflare Pages with SSR. @clerk/astro does not officially
// document CF Pages support; if Clerk has runtime issues, fall back to
// Vercel adapter (Phase 0 spike outcome documented in waitlist-launch.md).
export default defineConfig({
  site: 'https://siliconcrane.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    clerk(),
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
