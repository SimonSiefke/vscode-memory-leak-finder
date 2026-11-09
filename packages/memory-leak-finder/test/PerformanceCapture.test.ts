import { expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { takeHeapSnapshot } from '../src/parts/HeapSnapshot/HeapSnapshot.ts'
import * as MeasureHeapSnapshotBytes from '../src/parts/MeasureHeapSnapshotBytes/MeasureHeapSnapshotBytes.ts'
import { wrapMeasure } from '../src/parts/WrapMeasure/WrapMeasure.ts'

const createSession = (failure = false) => {
  const listeners = new Map<string, any>()
  const calls: string[] = []
  const session: any = {
    dispose() {},
    on: (event: string, listener: any) => listeners.set(event, listener),
    off: (event: string) => listeners.delete(event),
    invoke: async (method: string) => {
      calls.push(method)
      if (failure) throw new Error('snapshot unavailable')
      const value = JSON.stringify({
        snapshot: { meta: { node_fields: ['type', 'self_size'], node_types: [['object', 'code'], 'number'] } },
        nodes: [0, 100, 1, 50],
      })
      for (const chunk of [value.slice(0, 10), value.slice(10)]) listeners.get('HeapProfiler.addHeapSnapshotChunk')({ params: { chunk } })
      return { result: {} }
    },
  }
  return { session, listeners, calls }
}

test('snapshot byte measures use the ordinary streamed measure lifecycle and release their listener', async () => {
  const { session, listeners, calls } = createSession()
  const measure = wrapMeasure(MeasureHeapSnapshotBytes).create(session)
  try {
    const before = await measure.start()
    const after = await measure.stop()
    expect(before.map((metric: any) => metric.value)).toEqual([150, 50])
    expect(measure.compare(before, after, {})).toMatchObject({ isLeak: false })
    expect(calls).toEqual(['HeapProfiler.takeHeapSnapshot', 'HeapProfiler.takeHeapSnapshot'])
    expect(listeners.size).toBe(0)
  } finally {
    await measure.releaseResources()
  }
})

test('a failed snapshot rejects collection and finishes its stream without leaking event handlers', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'performance-snapshot-'))
  const { session, listeners } = createSession(true)
  try {
    await expect(takeHeapSnapshot(session, join(directory, 'snapshot.json'))).rejects.toThrow('snapshot unavailable')
    expect(listeners.size).toBe(0)
    // Let the pipeline settle before removing its output directory.
    await readFile(join(directory, 'snapshot.json')).catch(() => undefined)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
