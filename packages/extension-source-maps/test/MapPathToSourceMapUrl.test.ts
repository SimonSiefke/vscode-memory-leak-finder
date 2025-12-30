import { expect, test } from '@jest/globals'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import * as MapPathToSourceMapUrl from '../src/parts/MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'

test('mapPathToSourceMapUrl - returns file URL when source map exists', async () => {
  const tempRoot = join(tmpdir(), `test-map-path-${Date.now()}`)
  const extensionSourceMapsDir = join(tempRoot, '.extension-source-maps', 'github.copilot-chat-0.36.2025121004', 'dist')
  await mkdir(extensionSourceMapsDir, { recursive: true })
  await writeFile(join(extensionSourceMapsDir, 'extension.js.map'), '{}')

  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl(path, tempRoot)

  expect(result).toBeTruthy()
  expect(result).toMatch(/^file:\/\//)
  expect(result).toContain('extension.js.map')

  await rm(tempRoot, { recursive: true, force: true })
})

test('mapPathToSourceMapUrl - returns null when source map does not exist', () => {
  const tempRoot = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapUrl.mapPathToSourceMapUrl(path, tempRoot)
  expect(result).toBeNull()
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

