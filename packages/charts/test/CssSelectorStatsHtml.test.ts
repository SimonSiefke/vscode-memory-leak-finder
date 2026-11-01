import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, jest, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import {
  generateCssSelectorStatsHtml,
  getCssSelectorStatsData,
  renderCssSelectorStatsHtml,
} from '../src/parts/GenerateCssSelectorStatsHtml/GenerateCssSelectorStatsHtml.ts'

const row = (selector: string, elapsedMs: number, matchAttempts = 1) => ({ selector, elapsedMs, matchAttempts, matchCount: 1 })

test('loads nested results, combines stylesheets and generates the Pages route', async () => {
  const root = await mkdtemp(join(tmpdir(), 'css-selector-stats-'))
  try {
    expect(await getCssSelectorStatsData(root)).toEqual([])
    const folder = join(root, 'css-selector-stats', 'nested')
    await mkdir(folder, { recursive: true })
    await writeFile(
      join(folder, 'test.json'),
      JSON.stringify({ cssSelectorStats: { topSelectors: [row('.a', 1), row('.a', 2), row('.b', 0), row('.invalid', -1)] } }),
    )
    await writeFile(join(folder, 'empty.json'), JSON.stringify({ cssSelectorStats: { topSelectors: [] } }))
    const scenarios = await getCssSelectorStatsData(root)
    expect(scenarios).toEqual([
      { name: 'nested/empty', rows: [] },
      { name: 'nested/test', rows: [{ ...row('.a', 3, 2), matchCount: 2 }, row('.b', 0)] },
    ])
    const output = join(root, 'site', 'css-selector-stats')
    await generateCssSelectorStatsHtml(root, output)
    expect(await readFile(join(output, 'index.html'), 'utf8')).toBe(renderCssSelectorStatsHtml(scenarios))
    for (const [index, scenario] of scenarios.entries()) {
      expect(JSON.parse(await readFile(join(output, 'data', `${index}.json`), 'utf8'))).toEqual(scenario.rows)
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('renders the first nonempty scenario without JavaScript, escapes HTML and omits other scenario data', () => {
  const unsafe = '</script><img src=x onerror="alert(1)">'
  const rows = Array.from({ length: 1005 }, (_, i) => row(`.s${i}`, i))
  rows.push(row(unsafe, 5000.1234))
  const dom = new JSDOM(
    renderCssSelectorStatsHtml([
      { name: 'empty', rows: [] },
      { name: '<scenario>', rows },
      { name: 'other', rows: [row('.not-in-initial-html', 10)] },
    ]),
  )
  try {
    const document = dom.window.document
    expect(document.querySelectorAll('tbody tr')).toHaveLength(1000)
    expect(document.querySelector('tbody td')?.textContent).toBe(unsafe)
    expect(document.querySelector('tbody td:nth-child(2)')?.textContent).toBe('5,000.123')
    expect(document.querySelector('tbody tr:last-child td')?.textContent).toBe('.s6')
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector<HTMLSelectElement>('#scenario')?.value).toBe('1')
    expect(document.querySelector('option:checked')?.textContent).toBe('<scenario>')
    expect(document.querySelector('#status')?.textContent).toBe('Showing 1000 of 1006 matching selectors (1006 total)')
    expect(document.querySelector('script[type="application/json"]')).toBeNull()
    expect(dom.serialize()).not.toContain('.not-in-initial-html')
  } finally {
    dom.window.close()
  }
})

test('renders an empty status without JavaScript', () => {
  const dom = new JSDOM(renderCssSelectorStatsHtml([{ name: 'empty', rows: [] }]))
  try {
    expect(dom.window.document.querySelectorAll('tbody tr')).toHaveLength(0)
    expect(dom.window.document.querySelector('#status')?.textContent).toContain('No selector timing rows')
  } finally {
    dom.window.close()
  }
})

const flushRender = () => new Promise<void>((resolve) => setImmediate(resolve))

test('lazily loads and caches each scenario, sorts all selectors before limiting, filters and switches scenarios', async () => {
  const unsafe = '</script><img src=x onerror="alert(1)">'
  const rows = Array.from({ length: 1005 }, (_, i) => row(`.s${i}`, i, 2000 - i))
  rows.push(row(unsafe, 5000))
  const fetch = jest
    .fn<(url: string) => Promise<{ ok: boolean; json: () => Promise<typeof rows> }>>()
    .mockImplementation(async (url) => ({ ok: true, json: async () => (url === 'data/0.json' ? rows : []) }))
  const dom = new JSDOM(
    renderCssSelectorStatsHtml([
      { name: '<scenario>', rows },
      { name: 'empty', rows: [] },
    ]),
    {
      runScripts: 'dangerously',
      beforeParse: (window) => {
        window.fetch = fetch as unknown as typeof window.fetch
      },
    },
  )
  try {
    const document = dom.window.document
    const names = () => [...document.querySelectorAll('tbody tr td:first-child')].map((cell) => cell.textContent)
    const click = (key: string) => (document.querySelector(`[data-key="${key}"]`) as HTMLElement).click()
    expect(fetch).not.toHaveBeenCalled()
    expect(names()).toHaveLength(1000)
    expect(names()[0]).toBe(unsafe)
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('option')?.textContent).toBe('<scenario>')
    click('matchAttempts')
    await flushRender()
    expect(names()[0]).toBe('.s0')
    click('matchAttempts')
    await flushRender()
    expect(names()[0]).toBe(unsafe)
    const filter = document.querySelector('#filter') as HTMLInputElement
    filter.value = '.S1004'
    filter.dispatchEvent(new dom.window.Event('input'))
    await flushRender()
    expect(names()).toEqual(['.s1004'])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('data/0.json')
    const scenario = document.querySelector('#scenario') as HTMLSelectElement
    scenario.value = '1'
    scenario.dispatchEvent(new dom.window.Event('change'))
    await flushRender()
    expect(names()).toEqual([])
    expect(document.querySelector('#status')?.textContent).toContain('No selector timing rows')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith('data/1.json')
    scenario.value = '0'
    scenario.dispatchEvent(new dom.window.Event('change'))
    await flushRender()
    expect(names()).toEqual(['.s1004'])
    expect(fetch).toHaveBeenCalledTimes(2)
  } finally {
    dom.window.close()
  }
})

test('shares in-flight requests and ignores stale scenario responses', async () => {
  const firstRows = [row('.a', 10), row('.b', 20)]
  let resolveFirst!: (response: { ok: boolean; json: () => Promise<typeof firstRows> }) => void
  const fetch = jest.fn<(url: string) => Promise<{ ok: boolean; json: () => Promise<typeof firstRows> }>>().mockImplementation((url) =>
    url === 'data/0.json'
      ? new Promise((resolve) => {
          resolveFirst = resolve
        })
      : Promise.resolve({ ok: true, json: async () => [row('.other', 1)] }),
  )
  const dom = new JSDOM(
    renderCssSelectorStatsHtml([
      { name: 'first', rows: firstRows },
      { name: 'other', rows: [row('.other', 1)] },
    ]),
    {
      runScripts: 'dangerously',
      beforeParse: (window) => {
        window.fetch = fetch as unknown as typeof window.fetch
      },
    },
  )
  try {
    const document = dom.window.document
    const button = document.querySelector<HTMLElement>('[data-key="elapsedMs"]')!
    button.click()
    button.click()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(document.querySelectorAll('tbody tr')).toHaveLength(2)
    const scenario = document.querySelector<HTMLSelectElement>('#scenario')!
    scenario.value = '1'
    scenario.dispatchEvent(new dom.window.Event('change'))
    await flushRender()
    expect(document.querySelector('tbody td')?.textContent).toBe('.other')
    resolveFirst({ ok: true, json: async () => firstRows })
    await flushRender()
    expect(document.querySelector('tbody td')?.textContent).toBe('.other')
    expect(document.querySelector('#status')?.textContent).toBe('Showing 1 of 1 matching selectors (1 total)')
    scenario.value = '0'
    scenario.dispatchEvent(new dom.window.Event('change'))
    await flushRender()
    expect(document.querySelector('tbody td')?.textContent).toBe('.b')
    expect(fetch).toHaveBeenCalledTimes(2)
  } finally {
    dom.window.close()
  }
})

test('preserves the rendered table on HTTP or network failure and retries on the next interaction', async () => {
  const rows = [row('.a', 10), row('.b', 20)]
  const fetch = jest
    .fn<() => Promise<{ ok: boolean; json: () => Promise<typeof rows> }>>()
    .mockResolvedValueOnce({ ok: false, json: async () => [] })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ ok: true, json: async () => rows })
  const dom = new JSDOM(renderCssSelectorStatsHtml([{ name: 'first', rows }]), {
    runScripts: 'dangerously',
    beforeParse: (window) => {
      window.fetch = fetch as unknown as typeof window.fetch
    },
  })
  try {
    const document = dom.window.document
    const button = document.querySelector<HTMLElement>('[data-key="elapsedMs"]')!
    const initialTable = document.querySelector('tbody')!.innerHTML
    for (let i = 0; i < 2; i++) {
      button.click()
      await flushRender()
      expect(document.querySelector('#status')?.textContent).toContain('Could not load selector data')
      expect(document.querySelector('tbody')!.innerHTML).toBe(initialTable)
    }
    button.click()
    await flushRender()
    expect(document.querySelector('#status')?.textContent).toBe('Showing 2 of 2 matching selectors (2 total)')
    expect(document.querySelector('tbody td')?.textContent).toBe('.a')
    expect(fetch).toHaveBeenCalledTimes(3)
  } finally {
    dom.window.close()
  }
})
