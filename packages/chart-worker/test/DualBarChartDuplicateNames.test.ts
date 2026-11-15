import { expect, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import { createChart } from '../src/parts/CreateChart/CreateChart.ts'

test.each([false, true])('dual bar chart keeps same-named processes on separate rows (compressed: %s)', async (compress) => {
  const svg = await createChart(
    [
      { count: 132, delta: 120, name: 'VS Code' },
      { count: 130, delta: 118, name: 'VS Code' },
    ],
    { compress, fontSize: 12, marginLeft: 500, marginRight: 500, type: 'dual-bar-chart', width: 1400 },
  )
  const document = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document
  const labels = [...document.querySelectorAll('text')].filter((node) => node.textContent === 'VS Code')
  expect(labels).toHaveLength(2)
  expect(new Set(labels.map((node) => node.getAttribute('transform'))).size).toBe(2)
  const totals = [...document.querySelectorAll('text')].filter((node) => ['132', '130'].includes(node.textContent || ''))
  expect(totals.map((node) => node.textContent)).toEqual(['132', '130'])
  expect(new Set(totals.map((node) => node.getAttribute('transform'))).size).toBe(2)
})

test('duplicate names have the same bar geometry as distinct names', async () => {
  const options = { fontSize: 12, type: 'dual-bar-chart' }
  const data = Array.from({ length: 5 }, (_, index) => ({ count: 132 - index, delta: 120 - index, name: 'VS Code' }))
  const duplicates = await createChart(data, options)
  const distinct = await createChart(
    data.map((item, index) => ({ ...item, name: `Process ${index}` })),
    options,
  )
  expect(duplicates).toBe(distinct.replaceAll(/Process \d/g, 'VS Code'))
})

test('same-named process rows retain comparison highlights', async () => {
  const svg = await createChart(
    [
      { count: 132, delta: 120, name: 'VS Code' },
      { count: 130, delta: 118, name: 'VS Code' },
    ],
    { highlightLabels: ['VS Code'], type: 'dual-bar-chart' },
  )
  expect(svg).toContain('data-highlight-label="VS Code|VS Code"')
})
