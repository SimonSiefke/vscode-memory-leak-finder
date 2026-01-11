import { test, expect } from '@jest/globals'
import { getCacheFileOperations } from '../src/parts/GetCacheFileOperations/GetCacheFileOperations.ts'

test.skip('getCacheFileOperations returns empty array when no nodeModulesPaths provided', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [])

  const expected = [
    {
      path: '/cache/dir',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
  ]

  expect(result).toEqual(expected)
})

test.skip('getCacheFileOperations creates correct file operations for single node_modules path', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', ['node_modules'])

  const expected = [
    {
      path: '/cache/dir',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      from: '/repo/path/node_modules',
      to: '/cache/dir/cache-key/node_modules',
      type: 'copy',
    },
  ]

  expect(result).toEqual(expected)
})

test.skip('getCacheFileOperations handles multiple node_modules paths', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [
    'node_modules',
    'packages/a/node_modules',
    'packages/b/node_modules',
  ])

  const expected = [
    {
      path: '/cache/dir',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      from: '/repo/path/node_modules',
      to: '/cache/dir/cache-key/node_modules',
      type: 'copy',
    },
    {
      path: '/cache/dir/cache-key/packages/a',
      type: 'mkdir',
    },
    {
      from: '/repo/path/packages/a/node_modules',
      to: '/cache/dir/cache-key/packages/a/node_modules',
      type: 'copy',
    },
    {
      path: '/cache/dir/cache-key/packages/b',
      type: 'mkdir',
    },
    {
      from: '/repo/path/packages/b/node_modules',
      to: '/cache/dir/cache-key/packages/b/node_modules',
      type: 'copy',
    },
  ]

  expect(result).toEqual(expected)
})

test.skip('getCacheFileOperations handles paths with leading slashes correctly', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [
    '/node_modules',
    '/packages/a/node_modules',
  ])

  const expected = [
    {
      path: '/cache/dir',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      from: '/repo/path/node_modules',
      to: '/cache/dir/cache-key/node_modules',
      type: 'copy',
    },
    {
      path: '/cache/dir/cache-key/packages/a',
      type: 'mkdir',
    },
    {
      from: '/repo/path/packages/a/node_modules',
      to: '/cache/dir/cache-key/packages/a/node_modules',
      type: 'copy',
    },
  ]

  expect(result).toEqual(expected)
})

test.skip('getCacheFileOperations handles nested paths correctly', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [
    'packages/deeply/nested/module/node_modules',
  ])

  const expected = [
    {
      path: '/cache/dir',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key',
      type: 'mkdir',
    },
    {
      path: '/cache/dir/cache-key/packages/deeply/nested/module',
      type: 'mkdir',
    },
    {
      from: '/repo/path/packages/deeply/nested/module/node_modules',
      to: '/cache/dir/cache-key/packages/deeply/nested/module/node_modules',
      type: 'copy',
    },
  ]

  expect(result).toEqual(expected)
})

test.skip('getCacheFileOperations handles Windows-style paths', async () => {
  const result = await getCacheFileOperations(
    String.raw`C:\repo\path`,
    'cache-key',
    String.raw`C:\cache\dir`,
    String.raw`C:\cache\dir\cache-key`,
    ['node_modules', String.raw`packages\a\node_modules`],
  )

  const expected = [
    {
      path: 'C:\\cache\\dir',
      type: 'mkdir',
    },
    {
      path: 'C:\\cache\\dir\\cache-key',
      type: 'mkdir',
    },
    {
      path: 'C:\\cache\\dir\\cache-key',
      type: 'mkdir',
    },
    {
      from: 'C:\\repo\\path/node_modules',
      to: 'C:\\cache\\dir\\cache-key/node_modules',
      type: 'copy',
    },
    {
      path: 'C:\\cache\\dir\\cache-key',
      type: 'mkdir',
    },
    {
      from: 'C:\\repo\\path/packages\\a\\node_modules',
      to: 'C:\\cache\\dir\\cache-key/packages\\a\\node_modules',
      type: 'copy',
    },
  ]

  expect(result).toEqual(expected)
})

test.skip('getCacheFileOperations handles special characters in paths', async () => {
  const result = await getCacheFileOperations(
    '/repo/path with spaces',
    'cache-key-with-dashes',
    '/cache/dir with spaces',
    '/cache/dir with spaces/cache-key-with-dashes',
    ['node_modules', 'packages/my-package/node_modules'],
  )

  const expected = [
    {
      path: '/cache/dir with spaces',
      type: 'mkdir',
    },
    {
      path: '/cache/dir with spaces/cache-key-with-dashes',
      type: 'mkdir',
    },
    {
      path: '/cache/dir with spaces/cache-key-with-dashes',
      type: 'mkdir',
    },
    {
      from: '/repo/path with spaces/node_modules',
      to: '/cache/dir with spaces/cache-key-with-dashes/node_modules',
      type: 'copy',
    },
    {
      path: '/cache/dir with spaces/cache-key-with-dashes/packages/my-package',
      type: 'mkdir',
    },
    {
      from: '/repo/path with spaces/packages/my-package/node_modules',
      to: '/cache/dir with spaces/cache-key-with-dashes/packages/my-package/node_modules',
      type: 'copy',
    },
  ]

  expect(result).toEqual(expected)
})
