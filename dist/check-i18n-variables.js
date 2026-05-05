#!/usr/bin/env node

const {spawn} = require('node:child_process')
const path = require('path')

const [_nodeBin, scriptPath, ...args] = process.argv

const proc = spawn(`${path.dirname(scriptPath)}/check-i18n-variables`, args)

proc.stdout.on('data', data => {
  process.stdout.write(data)
})

proc.stderr.on('data', data => {
  process.stderr.write(data)
})
