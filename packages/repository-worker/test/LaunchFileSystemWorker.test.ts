import { beforeEach, expect, jest, test } from '@jest/globals'

const mockCreate = jest.fn() as any
const mockSet = jest.fn() as any

jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  NodeWorkerRpcParent: {
    create: mockCreate,
  },
}))

jest.unstable_mockModule('../src/parts/FileSystemWorker/FileSystemWorker.ts', () => ({
  set: mockSet,
}))

jest.unstable_mockModule('../src/parts/FileSystemWorkerPath/FileSystemWorkerPath.ts', () => ({
  fileSystemWorkerPath: '/test/file-system-worker.js',
}))

const { launchFileSystemWorker } = await import('../src/parts/LaunchFileSystemWorker/LaunchFileSystemWorker.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('launchFileSystemWorker - creates unrefed filesystem worker rpc', async () => {
  const rpc = { dispose: jest.fn(), invoke: jest.fn() }
  mockCreate.mockResolvedValue(rpc)

  await launchFileSystemWorker()

  expect(mockCreate).toHaveBeenCalledWith({
    commandMap: {},
    path: '/test/file-system-worker.js',
    ref: false,
  })
  expect(mockSet).toHaveBeenCalledWith(rpc)
})
