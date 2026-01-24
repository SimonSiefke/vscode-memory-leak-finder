import { expect, test } from '@jest/globals'
import * as ResolveExtensionSourceMap from '../src/parts/ResolveExtensionSourceMap/ResolveExtensionSourceMap.ts'

test('resolveExtensionSourceMap - handles file:/ URLs', async () => {
  const result = await ResolveExtensionSourceMap.resolveExtensionSourceMap('file:/home/simon/test.js:10:20', undefined, {
    extensionName: 'test-extension',
    repoUrl: 'https://github.com/test/test',
    cacheDir: '/tmp/cache',
  })
  // The result should be null because the file doesn't exist
  expect(result).toBeNull()
})

test('resolveExtensionSourceMap - handles file:/// URLs', async () => {
  const result = await ResolveExtensionSourceMap.resolveExtensionSourceMap('file:///home/simon/test.js:10:20', undefined, {
    extensionName: 'test-extension',
    repoUrl: 'https://github.com/test/test',
    cacheDir: '/tmp/cache',
  })
  // The result should be null because the file doesn't exist
  expect(result).toBeNull()
})

test('resolveExtensionSourceMap - handles regular paths', async () => {
  const result = await ResolveExtensionSourceMap.resolveExtensionSourceMap('/home/simon/test.js:10:20', undefined, {
    extensionName: 'test-extension',
    repoUrl: 'https://github.com/test/test',
    cacheDir: '/tmp/cache',
  })
  // The result should be null because the file doesn't exist
  expect(result).toBeNull()
})
