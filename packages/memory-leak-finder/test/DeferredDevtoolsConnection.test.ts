import { expect, jest, test } from '@jest/globals'

const measure = { start: jest.fn(async () => ({ count: 7 })) }
const rpc = { connectionClosed: () => false }
const getMeasureRpc = jest.fn(async (..._args: readonly unknown[]) => rpc)
jest.unstable_mockModule('../src/parts/GetMeasureRpc/GetMeasureRpc.ts', () => ({ getMeasureRpc }))
jest.unstable_mockModule('../src/parts/GetCombinedMeasure/GetCombinedMeasure.ts', () => ({ getCombinedMeasure: async () => measure }))
const { connectDevtools } = await import('../src/parts/ConnectDevtools/ConnectDevtools.ts')
const { start } = await import('../src/parts/MemoryLeakFinderStart/MemoryLeakFinderStart.ts')
const pending = await import('../src/parts/PendingDevtoolsConnectionState/PendingDevtoolsConnectionState.ts')

test('deferred connection waits until start and retains current RPC options', async () => {
  await connectDevtools(
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
  expect(getMeasureRpc).not.toHaveBeenCalled()
  await expect(start(41, 'target')).resolves.toEqual({ count: 7 })
  expect(getMeasureRpc).toHaveBeenCalledWith(
    'ws://browser',
    'ws://electron',
    3000,
    true,
    false,
    false,
    false,
    false,
    1001,
    1002,
    1003,
    ['existing-target'],
    true,
    9234,
    'bun',
  )
  expect(pending.get(41)).toBeUndefined()
})
