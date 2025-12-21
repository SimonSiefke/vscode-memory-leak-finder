import { expect, jest, test } from '@jest/globals'
import { MockRpc } from '@lvce-editor/rpc'
import * as FileSystemWorker from '../src/parts/FileSystemWorker/FileSystemWorker.ts'

test.skip('fixTypescriptErrors - adds ts-ignore operations and applies them', async () => {
  const { fixTypescriptErrors } = await import('../src/parts/FixTypescriptErrors/FixTypescriptErrors.ts')

  const mockInvoke = jest.fn()
  // @ts-ignore
  mockInvoke.mockImplementation((method: string, ...params: any[]) => {
    switch (method) {
      case 'FileSystem.applyFileOperations': {
        const ops = params[0]
        expect(ops).toEqual([
          {
            content: 'const a = 1\n// @ts-ignore\nconst b: number = "x"\n',
            path: '/repo/src/src/a.ts',
            type: 'write',
          },
        ])
        return undefined
      }
      case 'FileSystem.exec':
        return { exitCode: 2, stderr: '', stdout: 'src/a.ts:2:1 - error TS2345: message' }
      case 'FileSystem.findFiles':
        return ['src/tsconfig.json']
      case 'FileSystem.readFileContent':
        return 'const a = 1\nconst b: number = "x"\n'
      default:
        throw new Error(`unexpected method ${method}`)
    }
  })

  const mockRpc = MockRpc.create({
    commandMap: {},
    invoke: mockInvoke,
  })

  FileSystemWorker.set(mockRpc)

  await fixTypescriptErrors('/repo')

  expect(mockInvoke).toHaveBeenCalled()
})
