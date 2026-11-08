import { dirname, join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getMarkdownManifestPath, parseArgv, summarize, updateMarkdownManifest } from '../src/measureMarkdownPreviewLoadTime.ts'

test('parses Markdown preview benchmark options', () => {
  const options = parseArgv([
    '--vscode-path',
    '/tmp/vscode',
    '--runs',
    '37',
    '--max-attempts',
    '8',
    '--timeout-ms',
    '60000',
    '--output-directory',
    '/tmp/results',
    '--skip-build',
    '--resume',
  ])

  expect(options).toEqual({
    maxAttempts: 8,
    outputDirectory: '/tmp/results',
    resume: true,
    runs: 37,
    skipBuild: true,
    timeoutMs: 60_000,
    vscodePath: '/tmp/vscode',
  })
})

test('toggles only the Markdown direct-webview proposal', () => {
  const manifest = {
    displayName: 'Markdown',
    enabledApiProposals: ['documentDiff', 'webviewNoServiceWorker'],
    name: 'markdown-language-features',
  }

  const legacy = updateMarkdownManifest(manifest, false)
  const singleIframe = updateMarkdownManifest(legacy, true)

  expect(legacy).toEqual({
    displayName: 'Markdown',
    enabledApiProposals: ['documentDiff'],
    name: 'markdown-language-features',
  })
  expect(singleIframe).toEqual(manifest)
})

test('computes stable benchmark statistics', () => {
  expect(summarize([100, 140, 120, 110])).toEqual({
    max: 140,
    mean: 117.5,
    median: 115,
    min: 100,
    p95: 140,
    standardDeviation: 14.79,
  })
})

test('finds the built-in Markdown manifest next to the executable', () => {
  const executable = '/tmp/VSCode-linux-x64-vscode/code-oss'
  expect(getMarkdownManifestPath(executable)).toBe(
    join(dirname(executable), 'resources', 'app', 'extensions', 'markdown-language-features', 'package.json'),
  )
})
