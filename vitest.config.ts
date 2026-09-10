import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  // tsconfig.json sets `jsx: "preserve"` for Next.js's own SWC compiler. Vite's own transform
  // (oxc) can't handle "preserve" mode itself, so override it here for test runs only — this
  // doesn't touch tsconfig.json or the Next.js build.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    environment: 'node',
  },
})
