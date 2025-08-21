import { expect, test } from '@jest/globals'
import { getRestoreNodeModulesFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.ts'

test('getRestoreNodeModulesFileOperations returns empty array when no cached paths', async () => {
  const from = '/test/node-modules-cache/1234'
  const to = '/test/vscode/5678'
  const pathsToRestore = []
  const result = await getRestoreNodeModulesFileOperations(from, to, pathsToRestore)
  expect(result).toEqual([])
})

test('getRestoreNodeModulesFileOperations returns copy operations for cached paths', async () => {
  const from = '/test/node-modules-cache/1234'
  const to = '/test/vscode/5678'
  const pathsToRestore = ['node_modules/package1', 'node_modules/package2']
  const result = await getRestoreNodeModulesFileOperations(from, to, pathsToRestore)

  expect(result).toHaveLength(2)
  expect(result[0]).toEqual({
    type: 'copy',
    from: '/test/cache/cache-key/node_modules/package1',
    to: '/test/repo/node_modules/package1',
  })
  expect(result[1]).toEqual({
    type: 'copy',
    from: '/test/cache/cache-key/node_modules/package2',
    to: '/test/repo/node_modules/package2',
  })
})
