import assert from 'node:assert/strict'
import { test } from 'node:test'
import { summarizeAllocators } from '../src/nativeMemory.ts'

const allocator = (path: string, sizeBytes: number | null, pid = 2, processName = 'GPU Process') => ({ path, sizeBytes, pid, processName })

test('graphics totals use the root and do not double-count nested allocations', () => {
  const result = summarizeAllocators(
    [
      allocator('gpu', 1024),
      allocator('gpu/shared_images', 1024),
      allocator('gpu/shared_images/client/image', 1024),
      allocator('gpu', 8192, 1, 'Browser'),
      allocator('malloc/allocated_objects', 4096, 1, 'Browser'),
    ],
    1,
  )
  assert.equal(result.gpuBytes, 1024)
  assert.equal(result.mainMallocBytes, 4096)
})

test('missing GPU and malloc counters remain unavailable rather than reporting zero', () => {
  const result = summarizeAllocators([allocator('gpu', null), allocator('gpu/shader_cache', 64)], 1)
  assert.equal(result.gpuBytes, null)
  assert.equal(result.mainMallocBytes, null)
})

test('an explicitly reported zero GPU counter is preserved', () => {
  assert.equal(summarizeAllocators([allocator('gpu', 0)], 1).gpuBytes, 0)
})
