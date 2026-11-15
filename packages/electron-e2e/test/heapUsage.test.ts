import assert from 'node:assert/strict'
import { test } from 'node:test'
import { measureHeapUsage } from '../src/heapUsage.ts'

test('samples baseline and every cycle after GC, preserving byte precision and measurement order', async () => {
  const events: string[] = []
  const sizes = [3_334_280, 3_334_652, 3_334_776]
  const rpc = {
    dispose() {},
    async invoke<T = unknown>(method: string): Promise<T> {
      events.push(method)
      return (method === 'Runtime.getHeapUsage' ? { result: { usedSize: sizes.shift(), totalSize: 4_194_304 } } : { result: {} }) as T
    },
  }
  const result = await measureHeapUsage(rpc, 2, async () => {
    events.push('cycle')
  })
  assert.deepEqual(events, [
    'HeapProfiler.collectGarbage',
    'Runtime.getHeapUsage',
    'cycle',
    'HeapProfiler.collectGarbage',
    'Runtime.getHeapUsage',
    'cycle',
    'HeapProfiler.collectGarbage',
    'Runtime.getHeapUsage',
  ])
  assert.deepEqual(
    result.heapUsage.samples.map(({ cycle, usedSize }) => ({ cycle, usedSize })),
    [
      { cycle: 0, usedSize: 3_334_280 },
      { cycle: 1, usedSize: 3_334_652 },
      { cycle: 2, usedSize: 3_334_776 },
    ],
  )
  assert.equal(result.heapUsage.delta, 496)
})
