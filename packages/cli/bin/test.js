#!/usr/bin/env node

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const mainPath = join(__dirname, '..', 'src', 'main.ts')
const child = spawn('tsx', [mainPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd()
})

child.on('exit', (code) => {
  process.exit(code)
})
