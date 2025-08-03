import { test, expect } from '@jest/globals'
import { getHeapSnapshotWorkerPath } from '../src/parts/GetHeapSnapshotWorkerPath/GetHeapSnapshotWorkerPath.js'

test('getHeapSnapshotWorkerPath - returns correct worker path', () => {
  const workerPath = getHeapSnapshotWorkerPath()

  expect(typeof workerPath).toBe('string')
  expect(workerPath).toMatch(/heap-snapshot-parsing-worker\/bin\/heap-snapshot-parsing-worker\.js$/)
  expect(workerPath).not.toContain('undefined')
})

test('getHeapSnapshotWorkerPath - returns absolute path', () => {
  const workerPath = getHeapSnapshotWorkerPath()

  // Should be an absolute path (starts with / on Unix or C:\ style on Windows)
  expect(workerPath).toMatch(/^([A-Za-z]:)?[/\\]/)
})