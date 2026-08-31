import {promises as fs} from 'node:fs'
import os from 'node:os'
import p from 'node:path'

import {beforeEach, describe, expect, it} from 'vitest'

import {
  KNOWN_VARIABLES_TAG,
  UNKNOWN_VARIABLES_TAG,
  extractTranslationKeysAndVariables
} from './translation-extraction.js'

describe('extractTranslationKeysAndVariables', () => {
  let dir

  beforeEach(async () => {
    dir = await fs.mkdtemp(p.join(os.tmpdir(), 'i18n-scripts-extraction-'))
  })

  const extractFrom = async source => {
    const path = p.join(dir, 'source.jsx')
    await fs.writeFile(path, source)

    return extractTranslationKeysAndVariables(path).sort((a, b) =>
      a.i18nKey.localeCompare(b.i18nKey)
    )
  }

  it('finds t() keys and their variables', async () => {
    expect(
      await extractFrom(`
        const a = t('NO_VARS')
        const b = t('WITH_VARS', {name, count})
        const c = t('COMPLEX_VARS', {...spread})
      `)
    ).toEqual([
      {
        tag: UNKNOWN_VARIABLES_TAG,
        source: 't-application',
        i18nKey: 'COMPLEX_VARS'
      },
      {
        tag: KNOWN_VARIABLES_TAG,
        source: 't-application',
        i18nKey: 'NO_VARS',
        variables: []
      },
      {
        tag: KNOWN_VARIABLES_TAG,
        source: 't-application',
        i18nKey: 'WITH_VARS',
        variables: ['name', 'count']
      }
    ])
  })

  it('finds Trans keys and counts `count` as a variable', async () => {
    expect(
      await extractFrom(`
        const d = <Trans i18nKey="TRANS_PLAIN" />
        const e = <Trans i18nKey="TRANS_VARS" values={{who}} count={n} />
      `)
    ).toEqual([
      {
        tag: KNOWN_VARIABLES_TAG,
        source: 'trans-component',
        i18nKey: 'TRANS_PLAIN',
        variables: []
      },
      {
        tag: KNOWN_VARIABLES_TAG,
        source: 'trans-component',
        i18nKey: 'TRANS_VARS',
        variables: ['who', 'count']
      }
    ])
  })

  it('reports unknown variables when Trans values are not a simple object', async () => {
    expect(
      await extractFrom('const f = <Trans i18nKey="TRANS_COMPLEX" values={buildValues()} />')
    ).toEqual([
      {
        tag: UNKNOWN_VARIABLES_TAG,
        source: 'trans-component',
        i18nKey: 'TRANS_COMPLEX'
      }
    ])
  })

  it('ignores string literals that are not t() applications', async () => {
    expect(await extractFrom("const g = 'NOT_A_KEY'\nconst h = other('ALSO_NOT')")).toEqual([])
  })
})
