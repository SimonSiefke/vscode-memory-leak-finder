import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import * as MapPathToSourceMapPath from '../src/parts/MapPathToSourceMapPath/MapPathToSourceMapPath.ts'

test('mapPathToSourceMapPath - maps relative copilot extension path', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps', 'github.copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps absolute copilot extension path', () => {
  const root = tmpdir()
  const absolutePath = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js')
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(absolutePath, root)
  const expected = join(root, '.extension-source-maps', 'github.copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - returns null for empty path', () => {
  const root = tmpdir()
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath('', root)
  expect(result).toBeNull()
})

test('mapPathToSourceMapPath - returns null for non-copilot extension path', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/other-extension/dist/file.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  expect(result).toBeNull()
})

test('mapPathToSourceMapPath - returns null for path without .vscode-extensions', () => {
  const root = tmpdir()
  const path = 'some/other/path/file.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  expect(result).toBeNull()
})

test('mapPathToSourceMapPath - handles nested paths', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-1.0.0/src/utils/helper.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps', 'github.copilot-chat-1.0.0', 'src/utils/helper.js.map')
  expect(result).toBe(expected)
})
