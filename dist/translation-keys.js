#!/usr/bin/env node
//
// Attempt to find all translations keys in use in JS files passed on stdin.
//
// Usage:
//
//   git ls-files |
//      grep '\.js$' |
//      grep -v '\.min\.js$' |
//     ./scripts/translation-keys.js
//
// We stream out the keys as seen. We do no sorting or de-duplication.
//
const {extractTranslationKeysAndVariables} = require('./translation-extraction.js')
const readline = require('readline')

const lines = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

lines.on('line', path => {
  extractTranslationKeysAndVariables(path).forEach(({i18nKey}) => console.log(i18nKey))
})
