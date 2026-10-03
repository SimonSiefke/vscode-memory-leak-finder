import { expect, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import { computeVscodeNodeModulesCacheKey } from '../src/parts/ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.ts'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'
import { getHash } from '../src/parts/GetHash/GetHash.ts'

test('computeVscodeNodeModulesCacheKey - hashes platform, arch, nvmrc, and sorted package-lock contents', async () => {
  const folder = '/test/repo'
  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.findFiles': () => ['src/package-lock.json', 'package-lock.json'],
      'FileSystem.readFileContent': (path: string) => {
        switch (path) {
          case `${folder}/.nvmrc`:
            return 'v22.15.0'
          case `${folder}/package-lock.json`:
            return 'root-lock'
          case `${folder}/src/package-lock.json`:
            return 'nested-lock'
          default:
            throw new Error(`unexpected path ${path}`)
        }
      },
    },
  })
  FileSystemWorker.set(mockRpc)

  const result = await computeVscodeNodeModulesCacheKey(folder)

  expect(result).toBe(getHash([process.platform, process.arch, 'v22.15.0', 'root-lock', 'nested-lock']))
  expect(mockRpc.invocations).toEqual([
    ['FileSystem.findFiles', ['**/package-lock.json', '.vscode/**/package-lock.json'], { cwd: folder, exclude: ['**/node_modules/**'] }],
    ['FileSystem.readFileContent', `${folder}/.nvmrc`],
    ['FileSystem.readFileContent', `${folder}/package-lock.json`],
    ['FileSystem.readFileContent', `${folder}/src/package-lock.json`],
  ])
})

test('computeVscodeNodeModulesCacheKey - handles errors gracefully', async () => {
  const folder = '/nonexistent/path'
  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.findFiles': () => {
        throw new Error('File not found')
      },
    },
  })
  FileSystemWorker.set(mockRpc)

  await expect(computeVscodeNodeModulesCacheKey(folder)).rejects.toThrow('Failed to compute VS Code node_modules cache key')
  expect(mockRpc.invocations).toEqual([
    ['FileSystem.findFiles', ['**/package-lock.json', '.vscode/**/package-lock.json'], { cwd: folder, exclude: ['**/node_modules/**'] }],
  ])
})
