import { beforeEach, expect, jest, test } from '@jest/globals'

const mockDispose = jest.fn(async () => {})
const mockInvoke = jest.fn()
const mockCreate = jest.fn(async (_options: { path: string }) => {
  return {
    dispose: mockDispose,
    invoke: mockInvoke,
  }
})

jest.unstable_mockModule('@lvce-editor/rpc', () => {
  return {
    NodeWorkerRpcParent: {
      create: mockCreate,
    },
  }
})

const RepositoryWorker = await import('../src/parts/RepositoryWorker/RepositoryWorker.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

test('launch uses repository worker bin path', async () => {
  await using rpc = await RepositoryWorker.launch()
  expect(mockCreate).toHaveBeenCalledTimes(1)
  const options = mockCreate.mock.calls[0]?.[0]
  expect(options).toBeDefined()
  expect(options?.path).toContain('/packages/repository-worker/bin/repository-worker.js')
  expect(options?.path.startsWith('file://')).toBe(false)
  expect(rpc).toBeDefined()
})
