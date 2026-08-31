import {promises as fs} from 'node:fs'
import os from 'node:os'
import p from 'node:path'

import {beforeEach, describe, expect, it} from 'vitest'

import {filterJsFiles, getFiles, supportedLngs} from './helpers.js'

describe('filterJsFiles', () => {
  it('accepts js, ts and tsx', () => {
    expect(filterJsFiles({name: 'a.js'})).toBe(true)
    expect(filterJsFiles({name: 'a.ts'})).toBe(true)
    expect(filterJsFiles({name: 'a.tsx'})).toBe(true)
  })

  it('rejects minified js and other extensions', () => {
    expect(filterJsFiles({name: 'a.min.js'})).toBe(false)
    expect(filterJsFiles({name: 'a.css'})).toBe(false)
    expect(filterJsFiles({name: 'README'})).toBe(false)
  })
})

describe('supportedLngs', () => {
  it('lists the languages we translate into', () => {
    expect(supportedLngs).toEqual(['es', 'en', 'en-GB'])
  })
})

describe('getFiles', () => {
  let root

  beforeEach(async () => {
    root = await fs.mkdtemp(p.join(os.tmpdir(), 'i18n-scripts-helpers-'))

    await fs.writeFile(p.join(root, 'top.js'), '')
    await fs.mkdir(p.join(root, 'nested'))
    await fs.writeFile(p.join(root, 'nested', 'deep.tsx'), '')
    await fs.mkdir(p.join(root, 'node_modules'))
    await fs.writeFile(p.join(root, 'node_modules', 'ignored.js'), '')
    await fs.mkdir(p.join(root, '.cache'))
    await fs.writeFile(p.join(root, '.cache', 'ignored.js'), '')
  })

  it('recurses into subdirectories', async () => {
    const paths = (await getFiles(root)).map(({path}) => p.relative(root, path)).sort()

    expect(paths).toEqual(['nested/deep.tsx', 'top.js'])
  })

  it('skips node_modules and .cache', async () => {
    const paths = (await getFiles(root)).map(({path}) => path)

    expect(paths.some(path => path.includes('ignored.js'))).toBe(false)
  })
})
