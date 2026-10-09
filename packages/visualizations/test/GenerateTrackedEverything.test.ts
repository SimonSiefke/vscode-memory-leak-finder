import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateTrackedEverything } from '../src/generateTrackedEverything.ts'

test('generates a standalone tracked-everything viewer beside its event stream', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tracked-everything-viewer-'))
  const results = join(root, 'results')
  const assets = join(root, 'assets')
  const out = join(root, 'out')
  await mkdir(join(results, 'nested'), { recursive: true })
  await mkdir(assets, { recursive: true })
  await writeFile(join(assets, 'index.html'), '<title>VS Code Memory City</title><script src="./memory-city-data.js"></script>')
  await writeFile(join(results, 'nested', 'scenario.events.bin'), Buffer.alloc(4))
  await writeFile(
    join(results, 'nested', 'scenario.json'),
    JSON.stringify({
      durationMs: 1,
      eventCount: 1,
      eventFile: 'scenario.events.bin',
      schemaVersion: 1,
      sites: [{ id: 0, location: 'x:1:2', type: 'Object' }],
      timeMarks: [{ elapsedMs: 0, eventIndex: 0 }],
    }),
  )
  const outputs = await generateTrackedEverything(results, assets, out)
  expect(outputs).toEqual([join(out, 'nested', 'scenario')])
  expect(await readFile(join(outputs[0], 'scenario.events.bin'))).toEqual(Buffer.alloc(4))
  expect(await readFile(join(outputs[0], 'index.html'), 'utf8')).toContain('tracked-everything-data.js')
  expect(JSON.parse(await readFile(join(outputs[0], 'tracked-everything.json'), 'utf8'))).toEqual(
    expect.objectContaining({ kind: 'tracked-everything', scenario: 'nested/scenario' }),
  )
  expect(await readFile(join(out, 'index.html'), 'utf8')).toContain('nested/scenario/index.html')
  await rm(root, { force: true, recursive: true })
})
