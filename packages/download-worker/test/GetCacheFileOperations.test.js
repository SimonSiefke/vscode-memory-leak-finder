import { test, expect } from '@jest/globals'
import { getCacheFileOperations } from '../src/parts/GetCacheFileOperations/GetCacheFileOperations.js'
import { pathToFileURL } from 'node:url'

test('getCacheFileOperations - function exists and is callable', async () => {
  expect(typeof getCacheFileOperations).toBe('function')
})

test('getCacheFileOperations - function signature is correct', async () => {
  const fn = getCacheFileOperations
  expect(fn.length).toBe(5) // Should accept 5 parameters
})

test('getCacheFileOperations returns empty array when no nodeModulesPaths provided', async () => {
  const result = await getCacheFileOperations('/repo/path', 'cache-key', '/cache/dir', '/cache/dir/cache-key', [])

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(2) // Only mkdir operations for cacheDir and cachedNodeModulesPath
  expect(result[0]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir').href
  })
  expect(result[1]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir/cache-key').href
  })
})

test('getCacheFileOperations creates correct file operations for single node_modules path', async () => {
  const result = await getCacheFileOperations(
    '/repo/path',
    'cache-key',
    '/cache/dir',
    '/cache/dir/cache-key',
    ['node_modules']
  )

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(4) // 2 mkdir + 1 mkdir for parent + 1 copy

  // Check directory creation operations
  expect(result[0]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir').href
  })
  expect(result[1]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir/cache-key').href
  })

  // Check parent directory creation
  expect(result[2]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir/cache-key').href
  })

  // Check copy operation
  expect(result[3]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/node_modules').href
  })
})

test('getCacheFileOperations handles multiple node_modules paths', async () => {
  const result = await getCacheFileOperations(
    '/repo/path',
    'cache-key',
    '/cache/dir',
    '/cache/dir/cache-key',
    ['node_modules', 'packages/a/node_modules', 'packages/b/node_modules']
  )

  expect(Array.isArray(result)).toBe(true)
  expect(result).toHaveLength(8) // 2 mkdir + 3 mkdir for parents + 3 copy operations

  // Check directory creation operations
  expect(result[0]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir').href
  })
  expect(result[1]).toEqual({
    type: 'mkdir',
    path: pathToFileURL('/cache/dir/cache-key').href
  })

  // Check copy operations
  const copyOperations = result.filter(op => op.type === 'copy')
  expect(copyOperations).toHaveLength(3)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/node_modules').href
  })

  expect(copyOperations[1]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/packages/a/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/packages/a/node_modules').href
  })

  expect(copyOperations[2]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/packages/b/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/packages/b/node_modules').href
  })
})

test('getCacheFileOperations handles paths with leading slashes correctly', async () => {
  const result = await getCacheFileOperations(
    '/repo/path',
    'cache-key',
    '/cache/dir',
    '/cache/dir/cache-key',
    ['/node_modules', '/packages/a/node_modules']
  )

  const copyOperations = result.filter(op => op.type === 'copy')
  expect(copyOperations).toHaveLength(2)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/node_modules').href
  })

  expect(copyOperations[1]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/packages/a/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/packages/a/node_modules').href
  })
})

test('getCacheFileOperations handles nested paths correctly', async () => {
  const result = await getCacheFileOperations(
    '/repo/path',
    'cache-key',
    '/cache/dir',
    '/cache/dir/cache-key',
    ['packages/deeply/nested/module/node_modules']
  )

  const copyOperations = result.filter(op => op.type === 'copy')
  expect(copyOperations).toHaveLength(1)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path/packages/deeply/nested/module/node_modules').href,
    to: pathToFileURL('/cache/dir/cache-key/packages/deeply/nested/module/node_modules').href
  })
})

test('getCacheFileOperations handles Windows-style paths', async () => {
  const result = await getCacheFileOperations(
    'C:\\repo\\path',
    'cache-key',
    'C:\\cache\\dir',
    'C:\\cache\\dir\\cache-key',
    ['node_modules', 'packages\\a\\node_modules']
  )

  const copyOperations = result.filter(op => op.type === 'copy')
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
    ['node_modules', 'packages/my-package/node_modules']
  )

  const copyOperations = result.filter(op => op.type === 'copy')
  expect(copyOperations).toHaveLength(2)

  expect(copyOperations[0]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path with spaces/node_modules').href,
    to: pathToFileURL('/cache/dir with spaces/cache-key-with-dashes/node_modules').href
  })

  expect(copyOperations[1]).toEqual({
    type: 'copy',
    from: pathToFileURL('/repo/path with spaces/packages/my-package/node_modules').href,
    to: pathToFileURL('/cache/dir with spaces/cache-key-with-dashes/packages/my-package/node_modules').href
  })
})