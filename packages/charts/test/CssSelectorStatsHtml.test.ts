import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
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
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('sorts all selectors before limiting, filters, switches scenarios and treats selector HTML as text', () => {
  const unsafe = '</script><img src=x onerror="alert(1)">'
  const rows = Array.from({ length: 1005 }, (_, i) => row(`.s${i}`, i, 2000 - i))
  rows.push(row(unsafe, 5000))
  const dom = new JSDOM(
    renderCssSelectorStatsHtml([
      { name: '<scenario>', rows },
      { name: 'empty', rows: [] },
    ]),
    { runScripts: 'dangerously' },
  )
  try {
    const document = dom.window.document
    const names = () => [...document.querySelectorAll('tbody tr td:first-child')].map((cell) => cell.textContent)
    const click = (key: string) => (document.querySelector(`[data-key="${key}"]`) as HTMLElement).click()
    expect(names()).toHaveLength(1000)
    expect(names()[0]).toBe(unsafe)
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('option')?.textContent).toBe('<scenario>')
    click('matchAttempts')
    expect(names()[0]).toBe('.s0')
    click('matchAttempts')
    expect(names()[0]).toBe(unsafe)
    const filter = document.querySelector('#filter') as HTMLInputElement
    filter.value = '.S1004'
    filter.dispatchEvent(new dom.window.Event('input'))
    expect(names()).toEqual(['.s1004'])
    const scenario = document.querySelector('#scenario') as HTMLSelectElement
    scenario.value = '1'
    scenario.dispatchEvent(new dom.window.Event('change'))
    expect(names()).toEqual([])
    expect(document.querySelector('#status')?.textContent).toContain('No selector timing rows')
  } finally {
    dom.window.close()
  }
})
