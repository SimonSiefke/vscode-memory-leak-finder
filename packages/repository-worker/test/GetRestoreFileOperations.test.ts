import { expect, test } from '@jest/globals'
import { getRestoreNodeModulesFileOperations } from '../src/parts/GetRestoreFileOperations/GetRestoreFileOperations.ts'

test('getRestoreNodeModulesFileOperations returns empty array when no cached paths', () => {
  const from = '/test/node-modules-cache/1234'
  const to = '/test/vscode/5678'
  const pathsToRestore = []
  const result = getRestoreNodeModulesFileOperations(from, to, pathsToRestore)
  expect(result).toEqual([])
})

test('getRestoreNodeModulesFileOperations returns copy operations for cached paths', () => {
  const from = '/test/node-modules-cache/1234'
  const to = '/test/vscode/5678'
  const pathsToRestore = ['node_modules/package1', 'node_modules/package2']
  const result = getRestoreNodeModulesFileOperations(from, to, pathsToRestore)

  expect(result).toEqual([
    {
      type: 'copy',
      from: '/test/node-modules-cache/1234/node_modules/package1',
      to: '/test/vscode/5678/node_modules/package1',
    },
    {
      type: 'copy',
      from: '/test/node-modules-cache/1234/node_modules/package2',
      to: '/test/vscode/5678/node_modules/package2',
    },
  ])
})
