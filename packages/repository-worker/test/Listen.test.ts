import { expect, test, jest } from '@jest/globals'

// Mock the LaunchFileSystemWorker module
const mockLaunchFileSystemWorker = jest.fn()
jest.unstable_mockModule('../src/parts/LaunchFileSystemWorker/LaunchFileSystemWorker.js', () => ({
  launchFileSystemWorker: mockLaunchFileSystemWorker,
}))

// Mock the NodeWorkerRpcClient
const mockCreate = jest.fn()
jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  NodeWorkerRpcClient: {
    create: mockCreate,
  },
}))

const { listen } = await import('../src/parts/Listen/Listen.ts')

test('listen creates NodeWorkerRpcClient with commandMap', async () => {
  mockLaunchFileSystemWorker.mockResolvedValue(undefined)
  mockCreate.mockResolvedValue({})

  await listen()

  expect(mockLaunchFileSystemWorker).toHaveBeenCalled()
  expect(mockCreate).toHaveBeenCalledWith({
    commandMap: expect.any(Object),
  })
})

test('listen handles RPC client creation error', async () => {
  const error = new Error('RPC client creation failed')
  mockLaunchFileSystemWorker.mockResolvedValue(undefined)
  mockCreate.mockRejectedValue(error)

  await expect(listen()).rejects.toThrow('RPC client creation failed')
})
