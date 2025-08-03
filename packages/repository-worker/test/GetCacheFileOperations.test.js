import { test, expect } from '@jest/globals'
import { getCacheFileOperations } from '../src/parts/GetCacheFileOperations/GetCacheFileOperations.js'

test('getCacheFileOperations returns empty array when no nodeModulesPaths provided', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [])

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(2) // Only mkdir operations for cacheDir and cachedNodeModulesPath
  expect(result[0]).toEqual({
    type: 'mkdir',
    path: '/cache/dir',
  })
  expect(result[1]).toEqual({
    type: 'mkdir',
    path: '/cache/dir/cache-key',
  })
})

test('getCacheFileOperations creates correct file operations for single node_modules path', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', ['node_modules'])

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(4) // 2 mkdir + 1 mkdir for parent + 1 copy

  // Check directory creation operations
  expect(result[0]).toEqual({
    type: 'mkdir',
    path: '/cache/dir',
  })
  expect(result[1]).toEqual({
    type: 'mkdir',
    path: '/cache/dir/cache-key',
  })

  // Check parent directory creation
  expect(result[2]).toEqual({
    type: 'mkdir',
    path: '/cache/dir/cache-key',
  })

  // Check copy operation
  expect(result[3]).toEqual({
    type: 'copy',
    from: '/repo/path/node_modules',
    to: '/cache/dir/cache-key/node_modules',
  })
})

test('getCacheFileOperations handles multiple node_modules paths', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [
    'node_modules',
    'packages/a/node_modules',
    'packages/b/node_modules',
  ])

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(8) // 2 mkdir + 3 mkdir for parents + 3 copy operations

  // Check directory creation operations
  expect(result[0]).toEqual({
    type: 'mkdir',
    path: '/cache/dir',
  })
  expect(result[1]).toEqual({
    type: 'mkdir',
    path: '/cache/dir/cache-key',
  })

  // Check copy operations
  const copyOperations = result.filter((op) => op.type === 'copy')
  expect(copyOperations).toHaveLength(3)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: '/repo/path/node_modules',
    to: '/cache/dir/cache-key/node_modules',
  })

  expect(copyOperations[1]).toEqual({
    type: 'copy',
    from: '/repo/path/packages/a/node_modules',
    to: '/cache/dir/cache-key/packages/a/node_modules',
  })

  expect(copyOperations[2]).toEqual({
    type: 'copy',
    from: '/repo/path/packages/b/node_modules',
    to: '/cache/dir/cache-key/packages/b/node_modules',
  })
})

test('getCacheFileOperations handles paths with leading slashes correctly', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [
    '/node_modules',
    '/packages/a/node_modules',
  ])

  const copyOperations = result.filter((op) => op.type === 'copy')
  expect(copyOperations).toHaveLength(2)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: '/repo/path/node_modules',
    to: '/cache/dir/cache-key/node_modules',
  })

  expect(copyOperations[1]).toEqual({
    type: 'copy',
    from: '/repo/path/packages/a/node_modules',
    to: '/cache/dir/cache-key/packages/a/node_modules',
  })
})

test('getCacheFileOperations handles nested paths correctly', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [
    'packages/deeply/nested/module/node_modules',
  ])

  const copyOperations = result.filter((op) => op.type === 'copy')
  expect(copyOperations).toHaveLength(1)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: '/repo/path/packages/deeply/nested/module/node_modules',
    to: '/cache/dir/cache-key/packages/deeply/nested/module/node_modules',
  })
})

test('getCacheFileOperations handles Windows-style paths', async () => {
  const result = await getCacheFileOperations(
    String.raw`C:\repo\path`,
    'cache-key',
    String.raw`C:\cache\dir`,
    String.raw`C:\cache\dir\cache-key`,
    ['node_modules', String.raw`packages\a\node_modules`],
  )

  const copyOperations = result.filter((op) => op.type === 'copy')
  expect(copyOperations).toHaveLength(2)

  // The actual result will have the Windows paths converted to file URIs
  // We need to check what the actual output is
  expect(copyOperations[0].type).toBe('copy')
  expect(copyOperations[0].from).toMatch(/file:\/\/.*node_modules$/)
  expect(copyOperations[0].to).toMatch(/file:\/\/.*node_modules$/)

  expect(copyOperations[1].type).toBe('copy')
  expect(copyOperations[1].from).toMatch(/file:\/\/.*packages.*node_modules$/)
  expect(copyOperations[1].to).toMatch(/file:\/\/.*packages.*node_modules$/)
})

test('getCacheFileOperations handles special characters in paths', async () => {
  const result = await getCacheFileOperations(
    '/repo/path with spaces',
    'cache-key-with-dashes',
    '/cache/dir with spaces',
    '/cache/dir with spaces/cache-key-with-dashes',
    ['node_modules', 'packages/my-package/node_modules'],
  )

  const copyOperations = result.filter((op) => op.type === 'copy')
  expect(copyOperations).toHaveLength(2)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: '/repo/path with spaces/node_modules',
    to: '/cache/dir with spaces/cache-key-with-dashes/node_modules',
  })

  expect(copyOperations[1]).toEqual({
    type: 'copy',
    from: '/repo/path with spaces/packages/my-package/node_modules',
    to: '/cache/dir with spaces/cache-key-with-dashes/packages/my-package/node_modules',
  })
})
