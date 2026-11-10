import { expect, test } from '@jest/globals'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createResultFromFile } from '../src/parts/CreateResultFromFile/CreateResultFromFile.ts'
import { createChromiumMemoryDumpResult } from '../src/parts/ChromiumMemoryDump/ChromiumMemoryDump.ts'

const traceEvents = [
  { name: 'process_name', ph: 'M', pid: 7, args: { name: 'Renderer' } },
  ...['100', '180'].map((footprint, index) => ({
    args: { dumps: { level_of_detail: 'detailed', process_totals: { private_footprint_bytes: footprint } } },
    id: `0x${index}`,
    ph: 'v',
    pid: 7,
    ts: index + 1,
  })),
]

test.each(['legacy', 'streamed'])('%s capture preserves all parser metrics and inspected-process metadata', async (format) => {
  const directory = await mkdtemp(join(tmpdir(), 'chromium-capture-reader-'))
  const path = join(directory, 'capture.json')
  try {
    const capture = { dataLossOccurred: false, inspectedPid: 7, ...(format === 'legacy' ? { traceEvents } : { trace: { traceEvents } }) }
    await writeFile(path, JSON.stringify(capture))
    expect(await createResultFromFile(path)).toEqual(createChromiumMemoryDumpResult(traceEvents, false, 7))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('streamed data-loss metadata is not silently accepted as a complete capture', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'chromium-capture-reader-'))
  const path = join(directory, 'capture.json')
  try {
    await writeFile(path, JSON.stringify({ dataLossOccurred: true, trace: { traceEvents } }))
    expect(await createResultFromFile(path)).toMatchObject({ complete: false, dataLossOccurred: true, dumpCount: 2 })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
