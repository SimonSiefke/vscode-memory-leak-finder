import { expect, jest, test } from '@jest/globals'
import * as MemoryLeakFinderState from '../src/parts/MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { start } from '../src/parts/MemoryLeakFinderStart/MemoryLeakFinderStart.ts'

test('rejects a pending capture when its inspected target crashes', async () => {
  let crashListener: ((event: any) => void) | undefined
  const dispose = jest.fn()
  const off = jest.fn()
  MemoryLeakFinderState.set(91_002, {
    measure: {
      compare: jest.fn(),
      id: 'memoryCity',
      releaseResources: () => {},
      runCompletion: jest.fn(),
      start: () => new Promise(() => {}),
      stop: jest.fn(),
    },
    pid: 1,
    rpc: {
      dispose,
      invoke: jest.fn(),
      off,
      on: (_event: string, listener: (event: any) => void) => {
        crashListener = listener
      },
    } as any,
  })

  const result = start(91_002, 'renderer-target')
  crashListener?.({ params: { targetId: 'renderer-target' } })
  await expect(result).rejects.toThrow('Application crashed: target crashed')
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(off).toHaveBeenCalledTimes(1)
})
