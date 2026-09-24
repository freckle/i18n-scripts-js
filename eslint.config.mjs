import freckle from '@freckle/eslint-config'
import globals from 'globals'

export default [
  // The shared config scopes its rules to `**/*.ts`; this package is plain
  // JavaScript, so without retargeting it would lint nothing.
  ...freckle.map(config => (config.files ? {...config, files: ['**/*.js']} : config)),
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      // typescript-eslint turns this off because tsc reports undefined names;
      // nothing type-checks this package, so it has to come back on.
      'no-undef': 'error',
      // The sources are CommonJS until the ESM conversion in #97, which drops
      // this waiver.
      '@typescript-eslint/no-require-imports': 'off'
    }
  }
]
