import { expect, test } from '@jest/globals'
import * as ResolveExtensionSourceMap from '../src/parts/ResolveExtensionSourceMap/ResolveExtensionSourceMap.ts'

test('resolveExtensionSourceMap - handles file:/ URLs', async () => {
  const result = await ResolveExtensionSourceMap.resolveExtensionSourceMap(
    'file:/home/simon/test.js:10:20',
    undefined,
    {
      extensionName: 'test-extension',
      repoUrl: 'https://github.com/test/test',
      cacheDir: '/tmp/cache',
    },
  )
  expect(result).toBe('file:///path/to/source.map')
})

test('resolveExtensionSourceMap - handles file:/// URLs', async () => {
  const result = await ResolveExtensionSourceMap.resolveExtensionSourceMap(
    'file:///home/simon/test.js:10:20',
    undefined,
    {
      extensionName: 'test-extension',
      repoUrl: 'https://github.com/test/test',
      cacheDir: '/tmp/cache',
    },
  )
  expect(result).toBe('file:///path/to/source.map')
})

test('resolveExtensionSourceMap - handles regular paths', async () => {
  const result = await ResolveExtensionSourceMap.resolveExtensionSourceMap(
    '/home/simon/test.js:10:20',
    undefined,
    {
      extensionName: 'test-extension',
      repoUrl: 'https://github.com/test/test',
      cacheDir: '/tmp/cache',
    },
  )
  expect(result).toBe('file:///path/to/source.map')
})
