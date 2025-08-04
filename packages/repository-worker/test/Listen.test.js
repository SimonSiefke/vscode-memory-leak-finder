import { expect, test, jest } from '@jest/globals'

const mockNodeWorkerRpcClient = {
  create: jest.fn(async () => ({ rpc: {} })),
}

jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  NodeWorkerRpcClient: mockNodeWorkerRpcClient,
}))

const mockCommandMap = {
  'Repository.downloadAndBuildVscodeFromCommit': jest.fn(),
}

jest.unstable_mockModule('../src/parts/CommandMap/CommandMap.js', () => ({
  commandMap: mockCommandMap,
}))

const { listen } = await import('../src/parts/Listen/Listen.js')

test('listen creates NodeWorkerRpcClient with commandMap', async () => {
  mockNodeWorkerRpcClient.create.mockResolvedValue({ rpc: {} })

  await listen()

  expect(mockNodeWorkerRpcClient.create).toHaveBeenCalledWith({
    commandMap: mockCommandMap,
  })
})

test('listen handles RPC client creation error', async () => {
  const error = new Error('RPC client creation failed')

  mockNodeWorkerRpcClient.create.mockRejectedValue(error)

  await expect(listen()).rejects.toThrow('RPC client creation failed')
})
