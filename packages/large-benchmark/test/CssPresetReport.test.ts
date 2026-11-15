/** @jest-environment jsdom */
/// <reference lib="dom" />
import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Script } from 'node:vm'
import { generateReport, validateResult, comparisonsFor } from '../src/parts/Report/Report.ts'
import { writeJson } from '../src/parts/Io/Io.ts'
import { createWorkflowSummary } from '../src/parts/WorkflowSummary/WorkflowSummary.ts'
import type { Benchmark, Result } from '../src/parts/Types/Types.ts'
import type { CssPresetMetadata } from '../src/parts/CssPreset/CssPreset.ts'

const paths: string[] = []
afterEach(async () => {
  await Promise.all(paths.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
const commits = { before: 'a'.repeat(40), after: 'b'.repeat(40) }
const benchmark: Benchmark = {
  id: 'e2e-editor-open-renderer',
  scenario: 'editor-open',
  collector: 'renderer',
  startup: false,
  cache: 'action',
  diagnostic: false,
  samples: 5,
  sourceFile: 'packages/e2e/src/editor-open.ts',
  sourceSha256: 'c'.repeat(64),
}
const preset: CssPresetMetadata = {
  name: 'css-specific',
  harnessCommit: 'd'.repeat(40),
  harnessSourceSha256: 'f'.repeat(64),
  inventorySha256: 'e'.repeat(64),
  sampling: { samples: 5, startupSamples: 200, cssSelectorSamples: 37 },
  boundary: 'scenario.run() excludes setup/teardown',
  inventory: [
    {
      file: 'packages/e2e/src/editor-open.ts',
      sha256: 'c'.repeat(64),
      focused: false,
      selected: true,
      exclusion: null,
      explicitOptIn: false,
    },
    {
      file: 'packages/e2e/src/chat-test.ts',
      sha256: 'c'.repeat(64),
      focused: false,
      selected: false,
      exclusion: 'requiresCopilotAuth',
      explicitOptIn: false,
    },
  ],
}

const result = (): Result => ({
  schemaVersion: 1,
  benchmark,
  commits,
  requestedSamples: 5,
  status: 'success',
  runner: {},
  diagnostics: [],
  samples: Array.from({ length: 5 }, (_, pair) =>
    (['before', 'after'] as const).map((revision, order) => ({
      pair,
      revision,
      order,
      status: 'success' as const,
      elapsedMs: 1,
      diagnostics: [],
      raw: [],
      metrics: [
        { name: 'styleDuration', value: revision === 'before' ? 10 : 8, unit: 'ms', coverage: 'workbench renderer' },
        { name: 'styleCount', value: revision === 'before' ? 10 : 5, unit: 'count', coverage: 'workbench renderer' },
      ],
    })),
  ).flat(),
})

test('a preset report shows source inventory, percentage overview, contextual counts and incomplete coverage', async () => {
  const path = await mkdtemp(join(tmpdir(), 'css-report-'))
  paths.push(path)
  await writeJson(join(path, 'input/result.json'), result())
  const missing = { ...benchmark, id: 'e2e-missing-instructions', collector: 'instructions' as const }
  const summary = await generateReport({
    input: join(path, 'input'),
    output: join(path, 'output'),
    commits,
    benchmarks: [benchmark, missing],
    preset,
  })
  expect(summary.usable).toBe(true)
  expect(summary.complete).toBe(false)
  expect(summary.coverage[1]).toMatchObject({ status: 'missing', requested: 5 })
  const html = await readFile(join(path, 'output/index.html'), 'utf8')
  expect(html).toContain('Comparison incomplete')
  expect(html).toContain('requiresCopilotAuth')
  expect(html).toContain('Contextual count')
  expect(html).toContain('Frozen E2E inventory')
  expect(await readFile(join(path, 'output/charts/overview-style-time.svg'), 'utf8')).toContain('-20.00%')
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]!)
  for (const script of scripts) expect(() => new Script(script)).not.toThrow()
  document.body.innerHTML = html
  // Execute the actual filter with the report's HTML and SVG rows together.
  const filter = document.getElementById('filter') as HTMLInputElement
  const view = document.getElementById('view') as HTMLSelectElement
  const script = scripts.find((source) => source.includes('const view='))!
  Function(script)()
  filter.value = 'does-not-match'
  filter.dispatchEvent(new Event('input'))
  expect(document.querySelectorAll('g[data-id]:not([hidden])')).toHaveLength(0)
  expect(document.querySelector('svg[data-overview]')!.getAttribute('height')).toBe('105')
  filter.value = ''
  view.value = 'renderer'
  view.dispatchEvent(new Event('change'))
  expect(document.querySelectorAll('g[data-id]:not([hidden])')).toHaveLength(1)
  expect(document.querySelector('svg[data-overview]')!.getAttribute('height')).toBe('140')
  expect(createWorkflowSummary(summary)).toContain('Incomplete coverage')
  expect(createWorkflowSummary(summary)).toContain('Contextual count')
})

test('result sample counts must match the frozen request and diagnostic counts are neutral', () => {
  const data = result()
  expect(comparisonsFor(data).find((entry) => entry.metric === 'styleCount')!.direction).toBe('neutral')
  data.requestedSamples = 4
  expect(() => validateResult(data, benchmark, commits)).toThrow('sample count')
})
