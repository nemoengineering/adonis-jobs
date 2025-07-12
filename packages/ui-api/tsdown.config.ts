import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    ui_provider: './src/providers/app_provider.ts',
    types: './src/types.ts',
  },
  unbundle: true,
  exports: { devExports: true },
})
