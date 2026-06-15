import { expect, test } from '@jest/globals'
import { createMockRpc } from '@lvce-editor/rpc'
import { findTsConfigFiles } from '../src/parts/FindTsConfigFiles/FindTsConfigFiles.ts'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'

test('findTsConfigFiles - excludes copilot chat-lib tsconfig files', async () => {
  const rootDir = '/test/path'
  const mockRpc = createMockRpc({
    commandMap: {
      'FileSystem.findFiles': (_pattern: string, options: { cwd: string; exclude: readonly string[] }) => {
        expect(options).toEqual({
          cwd: rootDir,
          exclude: ['**/node_modules/**', '**/out/**', '**/.git/**', '**/extensions/copilot/chat-lib/**'],
        })
        return ['tsconfig.json']
      },
    },
  })

  FileSystemWorker.set(mockRpc)

  await expect(findTsConfigFiles(rootDir)).resolves.toEqual(['/test/path/tsconfig.json'])
})
