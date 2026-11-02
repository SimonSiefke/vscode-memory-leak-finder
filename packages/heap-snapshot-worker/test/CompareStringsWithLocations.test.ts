import { expect, test } from '@jest/globals'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { commandMap } from '../src/parts/CommandMap/CommandMap.ts'
import { compareStringsWithLocations } from '../src/parts/CompareStringsWithLocations/CompareStringsWithLocations.ts'

test('attributes actual V8 output strings to a retaining closure and observes release', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strings-with-locations-'))
  const fixture = join(directory, 'fixture.mjs')
  const paths = ['before', 'after', 'released'].map((name) => join(directory, `${name}.heapsnapshot`))
  try {
    await writeFile(
      fixture,
      `
      import { Session } from 'node:inspector'
      import { writeHeapSnapshot } from 'node:v8'
      import { writeFileSync } from 'node:fs'
      const paths = JSON.parse(process.argv[2])
      const scripts = {}
      const session = new Session()
      session.connect()
      session.on('Debugger.scriptParsed', ({ params }) => { scripts[params.scriptId] = { url: params.url } })
      await new Promise((resolve, reject) => session.post('Debugger.enable', (error) => error ? reject(error) : resolve()))
      function makeKeeper() {
        const queue = Array.from({ length: 12 }, () => ({ event: ['retained-output-', 'x'.repeat(64)].join('') }))
        return function keepOutput() { return queue }
      }
      writeHeapSnapshot(paths[0])
      globalThis.outputKeeper = makeKeeper()
      writeHeapSnapshot(paths[1])
      delete globalThis.outputKeeper
      writeHeapSnapshot(paths[2])
      writeFileSync(process.argv[3], JSON.stringify(scripts))
      session.disconnect()
    `,
    )
    const scriptsPath = join(directory, 'scripts.json')
    execFileSync(process.execPath, [fixture, JSON.stringify(paths), scriptsPath], { timeout: 30000 })
    const scripts = JSON.parse(await readFile(scriptsPath, 'utf8'))
    expect(commandMap['HeapSnapshot.compareStringsWithLocations']).toBe(compareStringsWithLocations)
    const growth = await compareStringsWithLocations(paths[0], paths[1], scripts, scripts)
    const output = `retained-output-${'x'.repeat(64)}`
    const group = growth.after.find((group) => group.string === output && group.sourceLocation?.startsWith(pathToFileURL(fixture).href))
    expect(group?.count).toBe(12)
    const unchanged = await compareStringsWithLocations(paths[1], paths[1], scripts, scripts)
    expect(unchanged.after).toEqual(unchanged.before)
    const released = await compareStringsWithLocations(paths[1], paths[2], scripts, scripts)
    expect(released.after.filter((group) => group.string === output).reduce((count, group) => count + group.count, 0)).toBe(0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}, 60000)
