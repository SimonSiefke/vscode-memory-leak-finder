import { expect, test } from '@jest/globals'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SourceMapGenerator } from 'source-map'
import { aggregate, profileCosts, sampleDurations, type Profile } from '../src/parts/StartupPerformance/Aggregate.ts'
import { generateStartupPerformance } from '../src/parts/StartupPerformance/StartupPerformance.ts'
import { applySiteLayout } from '../src/parts/ApplySiteLayout/ApplySiteLayout.ts'

const profile = (id: number, times: number[], leaf = 'work'): Profile => ({
  nodes: [
    { id, callFrame: { functionName: '(root)', url: '', lineNumber: -1, columnNumber: -1 }, children: [id + 1] },
    { id: id + 1, callFrame: { functionName: leaf, url: 'file:///app/work.js', lineNumber: 2, columnNumber: 3 } },
  ],
  samples: times.map(() => id + 1),
  timeDeltas: times,
})

test('aggregation matches stacks across run-local IDs and includes absent stacks only in successful profiles', () => {
  const profiles = [profile(1, [1000, 2000]), profile(80, [9000]), profile(8, [3000], 'other')]
  const rows = aggregate(profiles)
  expect(rows.find((row) => row.stack.includes('work'))).toMatchObject({ meanMs: 4, medianMs: 3 })
  expect(rows.find((row) => row.stack.includes('other'))).toMatchObject({ meanMs: 1, medianMs: 0 })
  expect(aggregate(profiles.toReversed())).toEqual(rows)
  expect(aggregate([])).toEqual([])
})

test('aggregation distinguishes parent chains and source locations', () => {
  const first = profile(1, [1000])
  const second = profile(5, [1000])
  second.nodes[0].callFrame.functionName = 'different parent'
  expect(aggregate([first, second])).toHaveLength(2)
  second.nodes[0].callFrame.functionName = '(root)'
  second.nodes[1].callFrame.lineNumber = 6
  expect(aggregate([first, second])).toHaveLength(2)
})

test('malformed samples, unknown nodes and cyclic stacks are rejected, never turned into zero', () => {
  expect(() => profileCosts({ ...profile(1, [1000]), timeDeltas: [] })).toThrow('matching time deltas')
  expect(() => profileCosts(profile(1, [NaN]))).toThrow('invalid sample')
  expect(() => profileCosts({ ...profile(1, [1000]), samples: [99] })).toThrow('unknown node')
  const cyclic = profile(1, [1000])
  cyclic.nodes[1].children = [1]
  expect(() => profileCosts(cyclic)).toThrow('cyclic')
})

test('startup report publishes four processes, raw evidence, failures and navigation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'startup-report-'))
  try {
    const results = join(root, 'results')
    const output = join(root, 'site', 'startup-performance')
    await mkdir(join(results, 'run-1'), { recursive: true })
    const profiles = Object.fromEntries(
      ['renderer', 'main', 'shared-process', 'extension-host'].map((name) => [name, { file: `run-1/${name}.cpuprofile`, attachedMs: 10 }]),
    )
    for (const name of Object.keys(profiles))
      await writeFile(join(results, profiles[name].file), JSON.stringify(profile(1, [1000, 2000], '<script>')))
    await writeFile(
      join(results, 'manifest.json'),
      JSON.stringify({
        samples: 3,
        generatedAt: '2026-11-09',
        environment: { cpu: 'test' },
        version: 'test version',
        workload: 'empty',
        cachePolicy: 'fresh',
        boundary: 'test boundary',
        overhead: 'test overhead',
        runs: [
          { run: 1, profiles },
          { run: 2, profiles: {}, error: 'capture <failed>' },
        ],
      }),
    )
    await generateStartupPerformance(results, output)
    await writeFile(join(root, 'site', 'index.html'), '<html><head><title>Reports</title></head><body></body></html>')
    await applySiteLayout(join(root, 'site'))
    const html = await readFile(join(output, 'index.html'), 'utf8')
    expect(html).toContain('1 of 3 requested captures')
    expect(html).toContain('1 launches not recorded')
    expect(html).toContain('capture &lt;failed&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('<pre>(root)\n&lt;script&gt; (work.js:3:4)</pre>')
    expect(html).toContain('not an averaged timeline')
    for (const name of Object.keys(profiles)) {
      expect(html).toContain(`id="${name}"`)
      expect(await readFile(join(output, `${name}.svg`), 'utf8')).toContain('<svg')
      expect(await readFile(join(output, profiles[name].file), 'utf8')).toBe(JSON.stringify(profile(1, [1000, 2000], '<script>')))
      expect(await readFile(join(output, `${name}-stacks.csv`), 'utf8')).toContain(',3,3')
    }
    expect(await readFile(join(root, 'site', 'index.html'), 'utf8')).toContain('Startup performance')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('empty results still provide an honest startup navigation destination', async () => {
  const root = await mkdtemp(join(tmpdir(), 'startup-empty-'))
  try {
    await generateStartupPerformance(join(root, 'missing'), join(root, 'report'))
    const html = await readFile(join(root, 'report', 'index.html'), 'utf8')
    expect(html.match(/No startup profiles have been collected/g)).toHaveLength(4)
    expect(html).not.toContain('src="./main.svg"')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('startup report uses source-mapped stack frame locations and keeps raw profiles unchanged', async () => {
  const root = await mkdtemp(join(tmpdir(), 'startup-source-map-'))
  try {
    const results = join(root, 'results')
    const output = join(root, 'report')
    await mkdir(join(results, 'run-1'), { recursive: true })
    const bundle = join(root, 'workbench.js')
    const sourceMapPath = `${bundle}.map`
    await writeFile(bundle, '')
    const generator = new SourceMapGenerator({ file: 'workbench.js' })
    generator.addMapping({ generated: { line: 3, column: 4 }, original: { line: 17, column: 8 }, source: 'src/workbench.ts' })
    await writeFile(sourceMapPath, generator.toString())
    const scriptMap = { '1': { url: pathToFileURL(bundle).toString(), sourceMapUrl: 'workbench.js.map' } }
    const mappedProfile: Profile = {
      nodes: [
        { id: 1, callFrame: { functionName: '(root)', url: '', lineNumber: -1, columnNumber: -1 }, children: [2] },
        { id: 2, callFrame: { functionName: 'startup', url: scriptMap['1'].url, lineNumber: 2, columnNumber: 3 } },
      ],
      samples: [2],
      timeDeltas: [1000],
    }
    const profiles = Object.fromEntries(['renderer', 'main', 'shared-process', 'extension-host'].map((name) => [name, { file: `run-1/${name}.cpuprofile`, scriptMap: `run-1/${name}-script-map.json` }]))
    for (const name of Object.keys(profiles)) {
      await writeFile(join(results, profiles[name].file), JSON.stringify(mappedProfile))
      await writeFile(join(results, profiles[name].scriptMap), JSON.stringify(scriptMap))
    }
    await writeFile(join(results, 'manifest.json'), JSON.stringify({ samples: 1, generatedAt: 'test', environment: {}, version: 'test', workload: 'test', cachePolicy: 'test', boundary: 'test', overhead: 'test', runs: [{ run: 1, profiles }] }))

    await generateStartupPerformance(results, output)

    const html = await readFile(join(output, 'index.html'), 'utf8')
    expect(html).toContain('startup (src/workbench.ts:17:9)')
    expect(await readFile(join(output, profiles.renderer.file), 'utf8')).toBe(JSON.stringify(mappedProfile))
    expect(JSON.parse(await readFile(join(output, profiles.renderer.scriptMap), 'utf8'))).toEqual(scriptMap)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('real V8 clock backsteps are normalized without adding sampled time', () => {
  const input = profile(1, [1000, -58, 1058])
  expect(sampleDurations(input)).toEqual([1000, 0, 1000])
  expect([...profileCosts(input).values()]).toEqual([2])
  expect(input.timeDeltas).toEqual([1000, -58, 1058])
})
