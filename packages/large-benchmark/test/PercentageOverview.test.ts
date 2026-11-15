/** @jest-environment jsdom */
/// <reference lib="dom" />
import { expect, test } from '@jest/globals'
import { comparePairs } from '../src/parts/Statistics/Statistics.ts'
import { overviewSvg } from '../src/parts/Overview/Overview.ts'
import type { Comparison } from '../src/parts/Report/Report.ts'

const comparison = (before = [10, 10, 10, 10, 10], after = [8, 8, 8, 8, 8]): Comparison => ({
  benchmark: 'e2e-editor-open-timing',
  scenario: 'editor-open',
  collector: 'timing',
  startup: false,
  cache: 'action',
  metric: 'actionTime',
  unit: 'ms',
  coverage: 'scenario.run()',
  higherIsBetter: false,
  statistics: comparePairs(before, after, 'median'),
})

test('percentage confidence intervals use resampled paired ratios', () => {
  const result = comparePairs([10, 10, 10, 10, 10], [8, 8, 8, 8, 8], 'median')
  expect(result.percentChange).toBe(-20)
  expect(result.percentInterval).toEqual([-20, -20])
  expect(result.interval).toEqual([-2, -2])
  expect(comparePairs([0, 0], [1, 1], 'mean').percentInterval).toBeNull()
  expect(comparePairs([0, 0, 1], [1, 1, 2], 'mean').percentInterval).toBeNull()
  expect(comparePairs([10, 11, 12], [8, 8, 9], 'mean')).toEqual(comparePairs([10, 11, 12], [8, 8, 9], 'mean'))
})

test('overview retains per-workload pair counts, uncertainty, zero baselines and escaped labels', () => {
  const uncertain = comparison([10, 20], [11, 19])
  const zero = { ...comparison([0, 0], [1, 1]), benchmark: 'zero-baseline' }
  const svg = overviewSvg([comparison(), uncertain, zero], '<Style & time>')
  document.body.innerHTML = svg
  expect(document.querySelector('svg')!.getAttribute('aria-label')).toBe('<Style & time>')
  expect(document.querySelectorAll('g[data-id]')).toHaveLength(3)
  expect(document.body.textContent).toContain('N/A (2 pairs)')
  expect(document.body.textContent).toContain('-20.00% (5 pairs)')
  expect(svg).toContain('#697386')
  expect(svg).not.toContain('<Style & time>')
  document.querySelector('g[data-id]')!.toggleAttribute('hidden', true)
  expect(document.querySelectorAll('g[hidden]')).toHaveLength(1)
})
