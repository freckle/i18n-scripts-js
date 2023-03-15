const fs = require('fs')
const parser = require('flow-parser')
const walk = require('esprima-walk')

const isIdentifierT = node => node && node.type === 'Identifier' && node.name === 't'

const isTransTag = node =>
  node.type === 'JSXElement' &&
  node.openingElement.type === 'JSXOpeningElement' &&
  node.openingElement.name.name === 'Trans'

const isJsxAttribute = attr => node =>
  node && node.type === 'JSXAttribute' && node.name.name === attr

const naiveLooksLikeApplication = (content, node, previousNode) =>
  content.slice(previousNode.range[1], node.range[0]).trim() === '('

const looksLikeTApplication = (content, node, previousNode) =>
  node.type === 'Literal' &&
  isIdentifierT(previousNode) &&
  naiveLooksLikeApplication(content, node, previousNode)

const isObjectWithSimpleProperties = node =>
  node.type === 'ObjectExpression' &&
  node.properties.every(p => p.type === 'Property' && p.key.type === 'Identifier')

const KNOWN_VARIABLES_TAG = 'i18n-key-with-known-variables'
const UNKNOWN_VARIABLES_TAG = 'i18n-key-with-unknown-variables'

const knownVariables = (source, i18nKey, objectWithSimpleProperties) => ({
  tag: KNOWN_VARIABLES_TAG,
  source,
  i18nKey,
  variables: objectWithSimpleProperties.properties.map(p => p.key.name)
})

const knownNoVariables = (source, i18nKey) => ({
  tag: KNOWN_VARIABLES_TAG,
  source,
  i18nKey,
  variables: []
})

const unknownVariables = (source, i18nKey) => ({
  tag: UNKNOWN_VARIABLES_TAG,
  source,
  i18nKey
})

module.exports.KNOWN_VARIABLES_TAG = KNOWN_VARIABLES_TAG
module.exports.UNKNOWN_VARIABLES_TAG = UNKNOWN_VARIABLES_TAG

// Attempt to find all translations keys and their provided variables in use in JS files.
//
// Methodology:
//
//   Locate any
//     - Literal nodes that immediately follow an Identifier node named t, and
//       output their value, or
//     - Trans component instances and output their i18nKey values
//
//   If possible, output any variables (if possible) used by the keys. This is
//   done with no further analysis than looking for a variable object and
//     - if one's not found, report no variables
//     - if one's found and is a simple object, report its properties
//     - if one's found and is a more complex object, report that the variables
//       are not known
//
// Yields keys with variables as encountered without sorting or de-duplication.
module.exports.extractTranslationKeysAndVariables = path => {
  const content = fs.readFileSync(path, {encoding: 'utf8'})
  const ast = parser.parse(content)

  const results = []
  let previousNode = null

  // Possible `tag` values are
  //  - 'finding-i18n-key' which means we're trying to find an i18n key
  //  - 'found-t-application' which means we found a key like `t('KEY'` and we
  //    ought to check the next token to see if it's a simple object literal
  let state = {tag: 'finding-i18n-key'}

  walk(ast, node => {
    switch (state.tag) {
      case 'finding-i18n-key': {
        if (looksLikeTApplication(content, node, previousNode)) {
          state = {tag: 'found-t-application', key: node.value}
        } else if (isTransTag(node)) {
          const i18nKey = node.openingElement.attributes.find(isJsxAttribute('i18nKey'))
          const values = node.openingElement.attributes.find(isJsxAttribute('values'))
          const hasCount = node.openingElement.attributes.some(isJsxAttribute('count'))

          // `Trans` keys can have a `count` property which ends up being a
          // variable. If we have known variables we've gotta account for it...
          const accountForCount = i18nKeyVithVariables => ({
            ...i18nKeyVithVariables,
            variables: i18nKeyVithVariables.variables.concat(hasCount ? ['count'] : [])
          })

          if (
            i18nKey.value.value &&
            values &&
            values.value.type === 'JSXExpressionContainer' &&
            isObjectWithSimpleProperties(values.value.expression)
          ) {
            results.push(
              accountForCount(
                knownVariables('trans-component', i18nKey.value.value, values.value.expression)
              )
            )
          } else if (i18nKey.value.value && !values) {
            results.push(accountForCount(knownNoVariables('trans-component', i18nKey.value.value)))
          } else if (i18nKey.value.value) {
            results.push(unknownVariables('trans-component', i18nKey.value.value))
          }
        }
        break
      }
      case 'found-t-application': {
        if (isObjectWithSimpleProperties(node)) {
          results.push(knownVariables('t-application', state.key, node))
        } else if (typeof node === 'number') {
          // No object after the key means no variables. For some reason this is an integer
          results.push(knownNoVariables('t-application', state.key))
        } else {
          results.push(unknownVariables('t-application', state.key))
        }
        state = {tag: 'finding-i18n-key'}
        break
      }
      case 'found-trans-component': {
        state = {tag: 'finding-i18n-key'}
        break
      }
    }

    previousNode = node
  })

  return results
}
