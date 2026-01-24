import { expect, test } from '@jest/globals'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as MapPathToSourceMapUrl from '../src/parts/MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'

test('mapPathToSourceMapUrl - returns file URL when source map exists', async () => {
  const tempRoot = join(tmpdir(), `test-map-path-${Date.now()}`)
  const extensionSourceMapsDir = join(tempRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist')
  await mkdir(extensionSourceMapsDir, { recursive: true })
  await writeFile(join(extensionSourceMapsDir, 'extension.js.map'), '{}')

  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl(path, tempRoot)

  expect(result).toBeTruthy()
  expect(result).toMatch(/^file:\/\//)
  expect(result).toContain('extension.js.map')

  await rm(tempRoot, { force: true, recursive: true })
})

test('mapPathToSourceMapUrl - returns file URL when source map does not exist', () => {
  const tempRoot = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl(path, tempRoot)
  expect(result).toBeTruthy()
  expect(result).toMatch(/^file:\/\//)
  expect(result).toContain('extension.js.map')
})

test('mapPathToSourceMapUrl - returns null for empty path', () => {
  const tempRoot = tmpdir()
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl('', tempRoot)
  expect(result).toBeNull()
})

test('mapPathToSourceMapUrl - returns null for non-copilot extension path', () => {
  const tempRoot = tmpdir()
  const path = '.vscode-extensions/other-extension/dist/file.js'
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl(path, tempRoot)
  expect(result).toBeNull()
})

test('mapPathToSourceMapUrl - returns file URL for js-debug extension path from vscode-insiders', () => {
  const root = '/test/.cache/repos/vscode-memory-leak-finder'
  const absolutePath =
    '/test/.cache/repos/vscode-memory-leak-finder/.vscode-insiders-versions/f3a7ce35470b1ae3fb47177d35e3964a24094372/VSCode-linux-x64/resources/app/extensions/ms-vscode.js-debug/src/extension.js.map'
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl(absolutePath, root, '1.105.0')

  expect(result).toBeTruthy()
  expect(result).toMatch(/^file:\/\//)
  expect(result).toContain('.extension-source-maps-cache/vscode-js-debug-1.105.0/dist/src/extension.js.map')
})
