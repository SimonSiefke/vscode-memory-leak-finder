import { expect, test, jest } from '@jest/globals'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Mock the Root module before importing ResolveFromPath
const mockRoot = tmpdir()
jest.unstable_mockModule('../src/parts/Root/Root.ts', () => ({
  root: mockRoot,
}))

// Mock the LaunchSourceMapWorker module
const mockInvoke = jest.fn<Promise<Record<string, any[]>>, [string, ...any[]]>()

// Mock the file system to always return true for existsSync
jest.unstable_mockModule('node:fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
}))

// Import the mocked modules
const ResolveFromPath = await import('../src/parts/ResolveFromPath/ResolveFromPath.ts')

test('resolveFromPath - resolves single path', async () => {
  const path = join(mockRoot, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  // Mock the source map worker response
  const sourceMapUrl = join(mockRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl]: [
      {
        line: 100,
        column: 200,
        source: 'src/extension.ts',
        name: 'activate',
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  console.log('Result:', result)
  console.log('Mock called:', mockInvoke.mock.calls)

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalUrl: 'src/extension.ts',
    originalLine: 100,
    originalColumn: 200,
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalLocation: 'src/extension.ts:100:200',
  })
})

test('resolveFromPath - resolves multiple paths', async () => {
  const path1 = join(mockRoot, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')
  const path2 = join(mockRoot, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/utils.js:30:5')

  // Mock the source map worker response
  const sourceMapUrl1 = join(mockRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  const sourceMapUrl2 = join(mockRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/utils.js.map')
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl1]: [
      {
        line: 100,
        column: 200,
        source: 'src/extension.ts',
        name: 'activate',
      },
    ],
    [sourceMapUrl2]: [
      {
        line: 30,
        column: 5,
        source: 'src/utils.ts',
        name: 'helperFunction',
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path1, path2])

  expect(result).toHaveLength(2)
  expect(result[0]).toEqual({
    originalUrl: 'src/extension.ts',
    originalLine: 100,
    originalColumn: 200,
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalLocation: 'src/extension.ts:100:200',
  })
  expect(result[1]).toEqual({
    originalUrl: 'src/utils.ts',
    originalLine: 30,
    originalColumn: 5,
    originalName: 'helperFunction',
    originalSource: 'src/utils.ts',
    originalLocation: 'src/utils.ts:30:5',
  })
})

test('resolveFromPath - returns empty object for invalid path', async () => {
  const result = await ResolveFromPath.resolveFromPath(['invalid-path'])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({})
})

test('resolveFromPath - returns empty object for path without source map', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/other-extension/dist/extension.js:917:1277')

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({})
})

test('resolveFromPath - handles js-debug extension path', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/ms-vscode.js-debug/src/extension.js:10:1268')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.105.0', 'dist/src/extension.js.map')
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl]: [
      {
        line: 5,
        column: 100,
        source: 'src/extension.ts',
        name: 'activate',
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalUrl: 'src/extension.ts',
    originalLine: 5,
    originalColumn: 100,
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalLocation: 'src/extension.ts:5:100',
  })
})

test('resolveFromPath - handles empty array', async () => {
  const result = await ResolveFromPath.resolveFromPath([])

  expect(result).toHaveLength(0)
})

test('resolveFromPath - handles source map resolution error', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  // Mock the source map worker to throw an error
  mockInvoke.mockRejectedValueOnce(new Error('Source map resolution failed'))

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({})
})

test('resolveFromPath - handles paths with special characters', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/file-name_with.special-chars.js:100:50')

  const sourceMapUrl = join(
    root,
    '.extension-source-maps-cache',
    'copilot-chat-0.36.2025121004',
    'dist/file-name_with.special-chars.js.map',
  )
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl]: [
      {
        line: 20,
        column: 30,
        source: 'src/file-name_with.special-chars.ts',
        name: 'specialFunction',
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalUrl: 'src/file-name_with.special-chars.ts',
    originalLine: 20,
    originalColumn: 30,
    originalName: 'specialFunction',
    originalSource: 'src/file-name_with.special-chars.ts',
    originalLocation: 'src/file-name_with.special-chars.ts:20:30',
  })
})

test('resolveFromPath - handles paths with null original source', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl]: [
      {
        line: 100,
        column: 200,
        source: null,
        name: null,
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalUrl: null,
    originalLine: 100,
    originalColumn: 200,
    originalName: null,
    originalSource: null,
    originalLocation: null,
  })
})

test('resolveFromPath - handles paths with null line or column', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl]: [
      {
        line: null,
        column: null,
        source: 'src/extension.ts',
        name: 'activate',
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalUrl: 'src/extension.ts',
    originalLine: null,
    originalColumn: null,
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalLocation: null,
  })
})

test('resolveFromPath - handles paths with ../ prefixes in source', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  mockInvoke.mockResolvedValueOnce({
    [sourceMapUrl]: [
      {
        line: 100,
        column: 200,
        source: '../src/extension.ts',
        name: 'activate',
      },
    ],
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalUrl: 'src/extension.ts',
    originalLine: 100,
    originalColumn: 200,
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalLocation: 'src/extension.ts:100:200',
  })
})
