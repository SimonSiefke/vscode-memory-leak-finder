#!/usr/bin/env node

import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const [extensionPath, loaderMode] = process.argv.slice(2)

if (!extensionPath || !['legacy', 'singleIframe'].includes(loaderMode)) {
  throw new Error('Usage: configure-codex-webview-benchmark.mjs <extension-path> <legacy|singleIframe>')
}

const packageJsonPath = join(extensionPath, 'package.json')
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
const enabledApiProposals = new Set(packageJson.enabledApiProposals || [])
if (loaderMode === 'singleIframe') {
  enabledApiProposals.add('webviewNoServiceWorker')
} else {
  enabledApiProposals.delete('webviewNoServiceWorker')
}
packageJson.enabledApiProposals = [...enabledApiProposals]
await writeFile(packageJsonPath, `${JSON.stringify(packageJson, undefined, 2)}\n`)

const webviewPath = join(extensionPath, 'webview')
const indexPath = join(webviewPath, 'index.html')
const benchmarkScriptName = 'vscode-memory-leak-finder-benchmark.js'
const benchmarkScriptTag = `    <script src="./${benchmarkScriptName}"></script>`
const indexHtml = await readFile(indexPath, 'utf8')
if (indexHtml.includes(benchmarkScriptTag)) {
  await writeFile(indexPath, indexHtml.replace(`${benchmarkScriptTag}\n`, ''))
}
await rm(join(webviewPath, benchmarkScriptName), { force: true })
