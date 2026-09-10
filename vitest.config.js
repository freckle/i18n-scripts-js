import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      // The bins are top-level scripts that run on import and talk to Locize;
      // only the modules they share are unit-testable.
      exclude: ['src/**/*.test.js', 'src/check-*.js', 'src/translation-keys.js'],
      // Remove to stop enforcing coverage (also revert ci.yml's pnpm coverage -> pnpm test)
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70
      }
    }
  }
})
