import { expect, test } from '@jest/globals'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as MapPathToSourceMapPath from '../src/parts/MapPathToSourceMapPath/MapPathToSourceMapPath.ts'

test('mapPathToSourceMapPath - maps relative copilot extension path', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps absolute copilot extension path', () => {
  const root = tmpdir()
  const absolutePath = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js')
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(absolutePath, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
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
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-1.0.0', 'src/utils/helper.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - handles different extension versions', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-1.2.3/dist/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-1.2.3', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - handles paths with special characters', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/file-name_with.special-chars.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/file-name_with.special-chars.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - handles very deeply nested paths', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/a/b/c/d/e/f/file.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'a/b/c/d/e/f/file.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - handles TypeScript files', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004/src/index.ts'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'src/index.ts.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - returns null for absolute path without .vscode-extensions', () => {
  const root = tmpdir()
  const path = '/some/absolute/path/file.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  expect(result).toBeNull()
})

test('mapPathToSourceMapPath - returns null for path with github.copilot-chat but wrong format', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat/dist/file.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  expect(result).toBeNull()
})

test('mapPathToSourceMapPath - handles paths with version containing dots', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-0.36.2025121004.123/dist/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004.123', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - handles absolute path with Unix-style root', () => {
  const root = '/home/user'
  const absolutePath = '/home/user/.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(absolutePath, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - strips v prefix from version in path', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/github.copilot-chat-v0.36.2025121004/dist/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - strips v prefix from version in absolute path', () => {
  const root = tmpdir()
  const absolutePath = join(root, '.vscode-extensions/github.copilot-chat-v0.36.2025121004/dist/extension.js')
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(absolutePath, root)
  const expected = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps relative js-debug extension path with default version', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/ms-vscode.js-debug/src/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root)
  const expected = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.105.0', 'dist/src/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps absolute js-debug extension path with default version', () => {
  const root = tmpdir()
  const absolutePath = join(root, '.vscode-extensions/ms-vscode.js-debug/src/extension.js')
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(absolutePath, root)
  const expected = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.105.0', 'dist/src/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps relative js-debug extension path with custom version', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/ms-vscode.js-debug/src/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root, '1.106.0')
  const expected = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.106.0', 'dist/src/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps absolute js-debug extension path with custom version', () => {
  const root = tmpdir()
  const absolutePath = join(root, '.vscode-extensions/ms-vscode.js-debug/src/extension.js')
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(absolutePath, root, '1.106.0')
  const expected = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.106.0', 'dist/src/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - maps js-debug extension path with nested file', () => {
  const root = tmpdir()
  const path = '.vscode-extensions/ms-vscode.js-debug/src/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root, '1.105.0')
  const expected = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.105.0', 'dist/src/extension.js.map')
  expect(result).toBe(expected)
})

test('mapPathToSourceMapPath - returns null for js-debug path without .vscode-extensions', () => {
  const root = tmpdir()
  const path = 'some/other/path/ms-vscode.js-debug/src/extension.js'
  const result = MapPathToSourceMapPath.mapPathToSourceMapPath(path, root, '1.105.0')
  expect(result).toBeNull()
})
