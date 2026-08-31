import {promises as fs} from 'node:fs'
import p from 'node:path'

// Modified from https://dev.to/leonard/get-files-recursive-with-the-node-js-file-system-fs-2n7o
export async function getFiles(path) {
  const allEntries = await fs.readdir(path, {withFileTypes: true})

  const entries = allEntries.filter(file => file.name !== 'node_modules' && file.name !== '.cache')

  const files = entries
    .filter(file => !file.isDirectory())
    .map(file => ({...file, path: p.join(path, file.name)}))

  const folders = entries.filter(folder => folder.isDirectory())

  for (const folder of folders) {
    files.push(...(await getFiles(p.join(path, folder.name))))
  }

  return files
}

export const filterJsFiles = f =>
  (f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.tsx')) &&
  !f.name.endsWith('min.js')

export const supportedLngs = ['es', 'en', 'en-GB']
