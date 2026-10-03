import { beforeEach, expect, test, jest } from '@jest/globals'

// Mock the LaunchFileSystemWorker module
const mockLaunchFileSystemWorker = jest.fn() as any
jest.unstable_mockModule('../src/parts/LaunchFileSystemWorker/LaunchFileSystemWorker.ts', () => ({
  launchFileSystemWorker: mockLaunchFileSystemWorker,
}))

const mockFileSystemWorkerDispose = jest.fn() as any
jest.unstable_mockModule('../src/parts/FileSystemWorker/FileSystemWorker.ts', () => ({
  applyFileOperations: jest.fn(),
  dispose: mockFileSystemWorkerDispose,
  exec: jest.fn(),
  findFiles: jest.fn(),
  makeDirectory: jest.fn(),
  pathExists: jest.fn(),
  readFileContent: jest.fn(),
  set: jest.fn(),
}))

// Mock the NodeWorkerRpcClient
const mockCreate = jest.fn() as any
jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  NodeWorkerRpcClient: {
    create: mockCreate,
  },
}))

const mockProcessOnce = jest.spyOn(process, 'once').mockImplementation(() => process)

const { listen } = await import('../src/parts/Listen/Listen.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('listen creates NodeWorkerRpcClient with commandMap', async () => {
  mockLaunchFileSystemWorker.mockResolvedValue(undefined)
  mockCreate.mockResolvedValue({})

  await listen()

  expect(mockLaunchFileSystemWorker).toHaveBeenCalled()
  expect(mockProcessOnce).toHaveBeenCalledWith('disconnect', expect.any(Function))
  expect(mockCreate).toHaveBeenCalledWith({
    commandMap: expect.any(Object),
  })
  expect(mockFileSystemWorkerDispose).not.toHaveBeenCalled()

  const disconnectHandler = mockProcessOnce.mock.calls.find(([event]) => event === 'disconnect')?.[1]
  expect(disconnectHandler).toBeDefined()
  disconnectHandler?.call(process)
  await Promise.resolve()
  expect(mockFileSystemWorkerDispose).toHaveBeenCalledTimes(1)
})

test('listen handles RPC client creation error', async () => {
  const error = new Error('RPC client creation failed')
  mockLaunchFileSystemWorker.mockResolvedValue(undefined)
  mockCreate.mockRejectedValue(error)

  await expect(listen()).rejects.toThrow('RPC client creation failed')
  expect(mockProcessOnce).toHaveBeenCalledWith('disconnect', expect.any(Function))
  expect(mockFileSystemWorkerDispose).not.toHaveBeenCalled()
})
