import { expect, jest, test } from '@jest/globals'
import * as MemoryLeakFinderState from '../src/parts/MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { stop } from '../src/parts/MemoryLeakFinderStop/MemoryLeakFinderStop.ts'

test('releases profiler resources when capture fails', async () => {
  const releaseResources = jest.fn<() => Promise<void>>().mockResolvedValue()
  MemoryLeakFinderState.set(91_001, {
    measure: {
      compare: jest.fn(),
      id: 'memoryCity',
      releaseResources,
      runCompletion: jest.fn(),
      start: jest.fn(),
      stop: jest.fn<() => Promise<never>>().mockRejectedValue(new Error('snapshot stream failed')),
    },
    pid: 1,
    rpc: {
      connectionClosed: () => false,
      dispose: jest.fn(),
      invoke: jest.fn(),
    } as any,
  })

  await expect(stop(91_001, 'renderer')).rejects.toThrow('snapshot stream failed')
  expect(releaseResources).toHaveBeenCalledTimes(1)
})
