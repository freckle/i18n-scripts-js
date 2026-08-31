#!/usr/bin/env node
//
// Checks all locize keys (in the codebase) with known variables against key
// values in locize ensuring that variables in locize refer to known vars.
//
import HttpBackend from 'i18next-http-backend'
import ICU from 'i18next-icu'
import i18next from 'i18next'
import {IntlMessageFormat} from 'intl-messageformat'

import {getFiles, filterJsFiles, supportedLngs} from './helpers.js'
import {extractTranslationKeysAndVariables, KNOWN_VARIABLES_TAG} from './translation-extraction.js'

const [_nodeBin, _scriptPath, ...projects] = process.argv

if (projects.length < 1) {
  console.error('Usage: check-i18n-variables <path>')
  process.exit(64)
}

// TODO: Pass in via ENV?
const ns = ['school', 'student', 'console', 'classroom', 'common']

const translationKeysWithKnownVariablesInProject = async project => {
  const files = await getFiles(project)
  const jsFiles = files.filter(filterJsFiles)
  const results = []

  jsFiles.forEach(({path}) => {
    extractTranslationKeysAndVariables(path)
      .filter(({tag}) => tag === KNOWN_VARIABLES_TAG)
      .forEach(keyWithVars => results.push(keyWithVars))
  })

  return results
}

// The AST is undocumented, however, its type definitions are here
//    https://github.com/formatjs/formatjs/blob/82a2e5d07f9a999624ffb6387a58464f9a5f7399/packages/icu-messageformat-parser/types.ts#L122-L131
const extractVariablesFromICUAst = ast => {
  // Some AST field values are `null`
  if (!ast) {
    return []
  }

  if (ast.constructor === Array) {
    return ast.flatMap(extractVariablesFromICUAst)
  }
  if (ast.constructor === Object) {
    const subVariables = Object.values(ast).flatMap(extractVariablesFromICUAst)
    // `type`s that aren't 0 (string literals) are variables when `.value` exists
    const hasVariable = ast.type && typeof ast.type === 'number' && ast.type !== 0 && ast.value

    return (hasVariable ? [ast.value] : []).concat(subVariables)
  }

  return []
}

const main = async () => {
  await i18next
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

  // Project key extraction is not cheap so cache per project
  const keysPerProject = {}

  await Promise.all(
    projects.map(
      async project =>
        (keysPerProject[project] = await translationKeysWithKnownVariablesInProject(project))
    )
  )

  for (const lang of supportedLngs) {
    await i18next.changeLanguage(lang)
    const translations = i18next.getDataByLanguage(lang)

    for (const [project, keys] of Object.entries(keysPerProject)) {
      for (const {i18nKey, variables: codeVariables} of keys) {
        const keyValue =
          (translations[project] && translations[project][i18nKey]) || translations.common[i18nKey]

        try {
          if (keyValue) {
            const locizeVariables = extractVariablesFromICUAst(
              new IntlMessageFormat(keyValue, lang, {}, {ignoreTag: true}).getAst()
            )

            for (const locizeVariable of locizeVariables) {
              if (!codeVariables.includes(locizeVariable)) {
                anyErrors = true
                console.error(
                  `${project}:${lang}:${i18nKey} does not pass the variable ${locizeVariable}`
                )
              }
            }
          }
        } catch {
          // We have another script that checks that `IntlMessageFormat` can
          // successfully parse the ICU text so let's not fail for that reason.
        }
      }
    }
  }

  if (anyErrors) {
    console.error(
      'The above keys have variables not passed by the code and need to be fixed in Locize.'
    )
    process.exit(1)
  } else {
    process.exit(0)
  }
}

main()
