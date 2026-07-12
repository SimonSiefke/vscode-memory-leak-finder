#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
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
let indexHtml = await readFile(indexPath, 'utf8')
if (!indexHtml.includes(benchmarkScriptTag)) {
  indexHtml = indexHtml.replace('    <script type="module"', `${benchmarkScriptTag}\n    <script type="module"`)
  await writeFile(indexPath, indexHtml)
}
await writeFile(
  join(webviewPath, benchmarkScriptName),
  `(() => {
  // The single-iframe loader intentionally uses an opaque origin, where DOM
  // storage is unavailable. Codex currently reads localStorage during startup,
  // so provide volatile storage to exercise the rest of the real application.
  try {
    globalThis.localStorage.length
  } catch {
    const values = new Map()
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        clear: () => values.clear(),
        getItem: (key) => values.has(String(key)) ? values.get(String(key)) : null,
        get length() { return values.size },
        key: (index) => Array.from(values.keys())[index] ?? null,
        removeItem: (key) => values.delete(String(key)),
        setItem: (key, value) => values.set(String(key), String(value)),
      },
    })
  }
  const originalAcquireVsCodeApi = globalThis.acquireVsCodeApi
  globalThis.acquireVsCodeApi = () => {
    const api = originalAcquireVsCodeApi()
    return Object.freeze({
      getState: () => api.getState(),
      postMessage: (message, transfer) => {
        if (message?.type === 'ready') {
          document.documentElement.dataset.vscodeMemoryLeakFinderReady = String(performance.timeOrigin + performance.now())
        }
        return api.postMessage(message, transfer)
      },
      setState: (state) => api.setState(state),
    })
  }
})()\n`,
)
