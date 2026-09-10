import eslint from '@eslint/js'
import {defineConfig} from 'eslint/config'
import globals from 'globals'

export default defineConfig([
  {
    ignores: ['dist/', 'coverage/']
  },
  {
    files: ['**/*.js'],
    extends: [eslint.configs.recommended],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}]
    }
  }
])
