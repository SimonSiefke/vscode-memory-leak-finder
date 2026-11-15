import { expect, test } from '@jest/globals'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { compareRetainedSubstrings } from '../src/parts/CompareRetainedSubstrings/CompareRetainedSubstrings.ts'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'

test('detects actual V8 sliced strings, independent parent references, and release', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'substring-heaps-'))
  const paths = ['before', 'slices', 'independent', 'released'].map((name) => join(directory, `${name}.heapsnapshot`))
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
      function createSlices() {
        const parent = Array(1024 * 1024).fill('a').join('')
        globalThis.substringFixture = [parent.slice(100, 132), parent.slice(200, 232)]
      }
      createSlices()
      writeHeapSnapshot(paths[1])
      globalThis.parentFixture = Array(2 * 1024 * 1024).fill('b').join('')
      globalThis.independentSlices = [globalThis.parentFixture.slice(100, 132)]
      writeHeapSnapshot(paths[2])
      delete globalThis.substringFixture
      delete globalThis.parentFixture
      delete globalThis.independentSlices
      writeHeapSnapshot(paths[3])
    `,
        JSON.stringify(paths),
      ],
      { timeout: 30000 },
    )
    expect(commandMap['HeapSnapshot.compareRetainedSubstrings']).toBe(compareRetainedSubstrings)
    const growth = await compareRetainedSubstrings(paths[0], paths[1])
    expect(growth.isLeak).toBe(true)
    expect(growth.delta).toBeGreaterThanOrEqual(1024 * 1024)
    const parent = growth.after.parents.find((item) => item.parentBytes >= 1024 * 1024 && item.sliceCount === 2)
    expect(parent?.exclusivelyRetained).toBe(true)
    expect(parent?.examples.every((item) => item.path.some((segment) => segment.property === 'substringFixture'))).toBe(true)
    const independent = await compareRetainedSubstrings(paths[1], paths[2])
    expect(independent.after.parents.find((item) => item.parentBytes >= 2 * 1024 * 1024)?.exclusivelyRetained).toBe(false)
    expect(independent.delta).toBe(0)
    expect(independent.isLeak).toBe(false)
    const released = await compareRetainedSubstrings(paths[2], paths[3])
    expect(released.delta).toBeLessThanOrEqual(-1024 * 1024)
    expect(released.isLeak).toBe(false)
    expect(released.after.exclusivelyRetainedBytes).toBe(growth.before.exclusivelyRetainedBytes)
    const unchanged = await compareRetainedSubstrings(paths[1], paths[1])
    expect(unchanged.delta).toBe(0)
    expect(unchanged.isLeak).toBe(false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 60000)
