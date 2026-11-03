import { expect, test } from '@jest/globals'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compareStringObjects } from '../src/parts/CompareStringObjects/CompareStringObjects.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'

test('compares actual V8 string objects across retention, unchanged snapshots, and release', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'string-object-heaps-'))
  const paths = ['before', 'retained', 'released'].map((name) => join(directory, `${name}.heapsnapshot`))
  try {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          import { writeHeapSnapshot } from 'node:v8'
          const paths = JSON.parse(process.argv[1])
          writeHeapSnapshot(paths[0])
          globalThis.outputQueue = Array.from({ length: 2048 }, (_, index) => ({
            event: [index, ':', 'x'.repeat(1024)].join(''),
          }))
          writeHeapSnapshot(paths[1])
          delete globalThis.outputQueue
          writeHeapSnapshot(paths[2])
        `,
        JSON.stringify(paths),
      ],
      { timeout: 30000 },
    )
    expect(commandMap['HeapSnapshot.compareStringObjects']).toBe(compareStringObjects)
    const growth = await compareStringObjects(paths[0], paths[1])
    expect(growth.delta.count).toBeGreaterThanOrEqual(2048)
    expect(growth.delta.bytes).toBeGreaterThanOrEqual(2048 * 1024)
    expect(growth.delta).toEqual({
      bytes: growth.after.bytes - growth.before.bytes,
      count: growth.after.count - growth.before.count,
    })
    const unchanged = await compareStringObjects(paths[1], paths[1])
    expect(unchanged.delta).toEqual({ bytes: 0, count: 0 })
    const released = await compareStringObjects(paths[1], paths[2])
    expect(released.delta.count).toBeLessThanOrEqual(-2048)
    expect(released.delta.bytes).toBeLessThanOrEqual(-2048 * 1024)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 60000)
