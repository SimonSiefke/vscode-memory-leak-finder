import { afterAll, expect, jest, test } from '@jest/globals'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'string-chart-site-'))
const rendererUrl = new URL('../../chart-worker/src/parts/CreateChart/CreateChart.ts', import.meta.url).href
const { createChart } = await import(rendererUrl)
const mergeUrl = new URL('../../build/src/mergeArtifacts.ts', import.meta.url).href
const { mergeArtifacts } = await import(mergeUrl)

jest.unstable_mockModule('../src/parts/Root/Root.ts', () => ({ root: directory }))
jest.unstable_mockModule('../src/parts/LaunchChartWorker/LaunchChartWorker.ts', () => ({
  launchChartWorker: async () => ({
    // Render actual SVGs while keeping the filesystem root isolated from other tests.
    invoke: async (_method: string, data: unknown, options: unknown) => createChart(data, options),
    async [Symbol.asyncDispose]() {},
  }),
}))
const { main } = await import('../src/parts/Main/Main.ts')

afterAll(async () => {
  await rm(directory, { recursive: true, force: true })
})

test('merges CI artifacts and generates overview SVGs, index images, and per-test detail pages', async () => {
  for (const processType of ['', 'node']) {
    for (const [name, key, values] of [
      ['string-object-count', 'stringObjectCount', [100, 160, 140]],
      ['string-object-bytes', 'stringObjectBytes', [8 * 1024 * 1024, 12 * 1024 * 1024, 10 * 1024 * 1024]],
    ] as const) {
      const results = join(directory, `vscode-memory-leak-finder-results-linux-${name}`, processType, name)
      await mkdir(results, { recursive: true })
      for (const [index, after] of values.entries()) {
        await writeFile(join(results, `case-${index + 1}.json`), JSON.stringify({ [key]: { before: after - 10, after } }))
      }
    }
  }
  const error = jest.fn()
  await mergeArtifacts({
    root: directory,
    targetDir: join(directory, '.vscode-memory-leak-finder-results'),
    logger: { log() {}, error },
  })
  expect(error).not.toHaveBeenCalled()
  await main()
  for (const processType of ['', 'node']) {
    const charts = join(directory, '.vscode-charts', processType)
    const index = await readFile(join(charts, 'index.html'), 'utf8')
    for (const [name, label] of [
      ['string-object-count', 'String Object Count'],
      ['string-object-bytes', 'String Object Size (bytes)'],
    ]) {
      const svg = await readFile(join(charts, `${name}.svg`), 'utf8')
      expect(svg).toContain('aria-label="line"')
      expect(svg).toContain(label)
      expect(svg).toContain('Test Case Index')
      expect(svg).not.toMatch(/NaN|Infinity/)
      expect(index).toContain(`src="./${name}.svg"`)
      const details = await readFile(join(charts, name, 'index.html'), 'utf8')
      expect(details).toContain('case-1.svg')
      expect(await readFile(join(charts, name, 'case-1.svg'), 'utf8')).toContain('String objects')
    }
  }
}, 30000)
