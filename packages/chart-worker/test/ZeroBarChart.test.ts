import { expect, test } from '@jest/globals'
import { createChart } from '../src/parts/CreateChart/CreateChart.ts'

test('all-zero observations retain labels without full-width bars', async () => {
  const svg = await createChart(
    [
      { name: 'load requests', value: 0 },
      { name: 'failures', value: 0 },
    ],
    { type: 'bar-chart' },
  )
  const root = document.createElement('div')
  root.innerHTML = svg
  expect(root.textContent).toContain('load requests')
  expect(root.textContent).toContain('failures')
  const bars = [...root.querySelectorAll('[aria-label="rect"] path')]
  expect(bars).toHaveLength(2)
  for (const bar of bars) {
    const path = bar.getAttribute('d') || ''
    expect(path).toMatch(/^M250,/)
    for (const [, x] of path.matchAll(/H([\d.]+)/g)) expect(Number(x)).toBe(250)
  }
})
