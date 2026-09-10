#!/usr/bin/env node
// @flow
//
// Checks all keys in Locize to make sure that they can be parsed by the `i18next` `t` function
//
const i18next = require('i18next')
const ICU = require('i18next-icu')
const HttpBackend = require('i18next-http-backend')
const {supportedLngs} = require('./helpers.js')

const VALID_NAMESPACES = ['school', 'student', 'console', 'classroom', 'common']

const ns = process.argv.slice(2)

for (const arg of ns) {
  if (!VALID_NAMESPACES.some(ns => ns === arg)) {
    throw new Error(`Invalid arguments: ${arg} is not a namespace`)
  }
}


const main = async () => {
  const t = await i18next
    .use(ICU)
    .use(HttpBackend)
    .init({
      supportedLngs,
      allowMultiLoading: true,
      keySeparator: false,
      ns,
      backend: {
        loadPath: 'https://translations.freckle.com/latest/{{lng}}/{{ns}}'
      }
    })

  let anyErrors = false

  for (const l of supportedLngs) {
    await i18next.changeLanguage(l)
    for (const n of ns) {
      for (const key of Object.keys(i18next.getDataByLanguage(l)[n])) {
        try {
          t(`${n}:${key}`)
        } catch (error) {
          if (!isInterpolationError(error)) {
            anyErrors = true
            console.error(`${n}:${l}:${key}`)
          }
        }
      }
    }
  }

  if (anyErrors) {
    console.error('The above keys cannot be parsed as ICU and need to be fixed in Locize.')
    process.exit(1)
  } else {
    process.exit(0)
  }
}

const isInterpolationError = error => /^The intl string context variable/.test(error.message)

main()
