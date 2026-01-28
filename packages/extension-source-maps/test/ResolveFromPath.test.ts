import { expect, test, jest } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Mock the Root module before importing ResolveFromPath
const mockRoot = tmpdir()
jest.unstable_mockModule('../src/parts/Root/Root.ts', () => ({
  root: mockRoot,
}))

// Mock the LaunchSourceMapWorker module
const mockLaunchSourceMapWorker = jest.fn()

jest.unstable_mockModule('../src/parts/LaunchSourceMapWorker/LaunchSourceMapWorker.ts', () => ({
  launchSourceMapWorker: mockLaunchSourceMapWorker,
}))

// Mock the file system to always return true for existsSync
jest.unstable_mockModule('node:fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
}))

// Import the mocked modules
const ResolveFromPath = await import('../src/parts/ResolveFromPath/ResolveFromPath.ts')

test.skip('resolveFromPath - resolves single path', async () => {
  const path = join(mockRoot, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  // Mock the source map worker response
  const sourceMapUrl = join(mockRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl]: [
            {
              column: 200,
              line: 100,
              name: 'activate',
              source: 'src/extension.ts',
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalColumn: 200,
    originalLine: 100,
    originalLocation: 'src/extension.ts:100:200',
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalUrl: 'src/extension.ts',
  })
})

test.skip('resolveFromPath - resolves multiple paths', async () => {
  const path1 = join(mockRoot, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')
  const path2 = join(mockRoot, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/utils.js:30:5')

  // Mock the source map worker response
  const sourceMapUrl1 = join(mockRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  const sourceMapUrl2 = join(mockRoot, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/utils.js.map')
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl1]: [
            {
              column: 200,
              line: 100,
              name: 'activate',
              source: 'src/extension.ts',
            },
          ],
          [sourceMapUrl2]: [
            {
              column: 5,
              line: 30,
              name: 'helperFunction',
              source: 'src/utils.ts',
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path1, path2])

  expect(result).toHaveLength(2)
  expect(result[0]).toEqual({
    originalColumn: 200,
    originalLine: 100,
    originalLocation: 'src/extension.ts:100:200',
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalUrl: 'src/extension.ts',
  })
  expect(result[1]).toEqual({
    originalColumn: 5,
    originalLine: 30,
    originalLocation: 'src/utils.ts:30:5',
    originalName: 'helperFunction',
    originalSource: 'src/utils.ts',
    originalUrl: 'src/utils.ts',
  })
})

test.skip('resolveFromPath - returns empty object for invalid path', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath(['invalid-path'])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({})
})

test.skip('resolveFromPath - returns empty object for path without source map', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/other-extension/dist/extension.js:917:1277')

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({})
})

test.skip('resolveFromPath - handles js-debug extension path', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/ms-vscode.js-debug/src/extension.js:10:1268')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'vscode-js-debug-1.105.0', 'dist/src/extension.js.map')
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl]: [
            {
              column: 100,
              line: 5,
              name: 'activate',
              source: 'src/extension.ts',
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalColumn: 100,
    originalLine: 5,
    originalLocation: 'src/extension.ts:5:100',
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalUrl: 'src/extension.ts',
  })
})

test.skip('resolveFromPath - handles empty array', async () => {
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([])

  expect(result).toHaveLength(0)
})

test.skip('resolveFromPath - handles source map resolution error', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  // Mock the source map worker to throw an error
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      throw new Error('Source map resolution failed')
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({})
})

test.skip('resolveFromPath - handles paths with special characters', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/file-name_with.special-chars.js:100:50')

  const sourceMapUrl = join(
    root,
    '.extension-source-maps-cache',
    'copilot-chat-0.36.2025121004',
    'dist/file-name_with.special-chars.js.map',
  )
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl]: [
            {
              column: 30,
              line: 20,
              name: 'specialFunction',
              source: 'src/file-name_with.special-chars.ts',
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalColumn: 30,
    originalLine: 20,
    originalLocation: 'src/file-name_with.special-chars.ts:20:30',
    originalName: 'specialFunction',
    originalSource: 'src/file-name_with.special-chars.ts',
    originalUrl: 'src/file-name_with.special-chars.ts',
  })
})

test.skip('resolveFromPath - handles paths with null original source', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl]: [
            {
              column: 200,
              line: 100,
              name: null,
              source: null,
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalColumn: 200,
    originalLine: 100,
    originalLocation: null,
    originalName: null,
    originalSource: null,
    originalUrl: null,
  })
})

test.skip('resolveFromPath - handles paths with null line or column', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl]: [
            {
              column: null,
              line: null,
              name: 'activate',
              source: 'src/extension.ts',
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalColumn: null,
    originalLine: null,
    originalLocation: null,
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalUrl: 'src/extension.ts',
  })
})

test.skip('resolveFromPath - handles paths with ../ prefixes in source', async () => {
  const root = tmpdir()
  const path = join(root, '.vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277')

  const sourceMapUrl = join(root, '.extension-source-maps-cache', 'copilot-chat-0.36.2025121004', 'dist/extension.js.map')
  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: (method: string, ...params: readonly any[]) => {
      if (method === 'SourceMap.getCleanPositionsMap') {
        return {
          [sourceMapUrl]: [
            {
              column: 200,
              line: 100,
              name: 'activate',
              source: '../src/extension.ts',
            },
          ],
        }
      }
      throw new Error(`unexpected method ${method}`)
    },
  })

  mockLaunchSourceMapWorker.mockReturnValue({
    invoke: mockRpc.invoke.bind(mockRpc),
    async [Symbol.asyncDispose]() {},
  })

  const result = await ResolveFromPath.resolveFromPath([path])

  expect(result).toHaveLength(1)
  expect(result[0]).toEqual({
    originalColumn: 200,
    originalLine: 100,
    originalLocation: 'src/extension.ts:100:200',
    originalName: 'activate',
    originalSource: 'src/extension.ts',
    originalUrl: 'src/extension.ts',
  })
})
