import { expect, test } from '@jest/globals'
import { JSDOM } from 'jsdom'
import { createChart } from '../src/parts/CreateChart/CreateChart.ts'

test.each([false, true])('clamps long single-line labels within their margin and preserves tooltips (compressed: %s)', async (compress) => {
  const string = 'a string containing repeated text '.repeat(20)
  const location = 'src/a-very-long-path/'.repeat(10) + 'owner.ts:42:7'
  const title = '5 added string objects\n' + string + '\n' + location
  const svg = await createChart(
    [
      { name: 'full identity', label: `${string} at ${location}`, title, count: 5, delta: 5 },
      { name: 'another identity', label: 'second at unknown location', title: 'second tooltip', count: 1, delta: 1 },
    ],
    { compress, type: 'dual-bar-chart', width: 1600, marginLeft: 800, marginRight: 100, rowHeight: 20, fontSize: 12, labelLineWidth: 64 },
  )
  const document = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document
  const labels = [...document.querySelectorAll('[aria-label="y-axis tick label"] text')]
  expect(labels).toHaveLength(2)
  expect(labels[0].querySelectorAll('tspan')).toHaveLength(0)
  expect(labels[0].firstChild?.textContent).toContain('…')
  expect(labels[0].firstChild?.textContent?.length).toBeLessThan(string.length)
  expect([...document.querySelectorAll('title')].some((node) => node.textContent === title)).toBe(true)
  expect(Number(document.documentElement.getAttribute('height'))).toBeGreaterThanOrEqual(40)
})
