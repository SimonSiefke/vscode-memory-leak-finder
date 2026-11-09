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

test('merges CI artifacts and generates overview SVGs without string object detail pages', async () => {
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
  for (const processType of ['', 'node', 'shared-process', 'extension-host', 'pty-host', 'integrated-browser']) {
    for (const name of ['string-object-count', 'string-object-bytes']) {
      const staleDetails = join(directory, '.vscode-charts', processType, name)
      await mkdir(staleDetails, { recursive: true })
      await writeFile(join(staleDetails, 'old-case.svg'), '<svg></svg>')
      await writeFile(join(staleDetails, 'index.html'), '<html>stale detail page</html>')
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
      await expect(readFile(join(charts, name, 'index.html'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
      expect(index).not.toContain(`${name}/`)
    }
  }
  const sitemap = await readFile(join(directory, '.vscode-charts', 'sitemap.xml'), 'utf8')
  expect(sitemap).not.toContain('string-object-count')
  expect(sitemap).not.toContain('string-object-bytes')
  for (const processType of ['node', 'shared-process', 'extension-host', 'pty-host', 'integrated-browser']) {
    const charts = join(directory, '.vscode-charts', processType)
    for (const name of ['string-object-count', 'string-object-bytes']) {
      await expect(readFile(join(charts, name, 'index.html'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    }
  }
}, 30000)
