import { expect, jest, test } from '@jest/globals'

const invoke = jest.fn(async (..._args: readonly unknown[]) => undefined)
const rpc = { invoke }
jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  NodeWorkerRpcParent: { create: async () => rpc },
}))
const { startWorker } = await import('../src/parts/MemoryLeakWorker/MemoryLeakWorker.ts')

test('subprocess worker preserves current target exclusions and appends deferred Bun options', async () => {
  await startWorker(
    'ws://browser',
    'ws://electron',
    41,
    'instance-count',
    3000,
    false,
    false,
    false,
    false,
    false,
    1001,
    1002,
    1003,
    123,
    ['existing-target'],
    '',
    undefined,
    true,
    9234,
    'bun',
  )
  expect(invoke).toHaveBeenCalledWith(
    'ConnectDevtools.connectDevtools',
    'ws://browser',
    'ws://electron',
    41,
    'instance-count',
    3000,
    true,
    false,
    false,
    false,
    false,
    1001,
    1002,
    1003,
    123,
    ['existing-target'],
    true,
    9234,
    'bun',
    true,
  )
})
