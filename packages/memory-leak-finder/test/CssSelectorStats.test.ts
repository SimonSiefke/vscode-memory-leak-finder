import { expect, test } from '@jest/globals'
import { formatCssSelectorStatsSummary, getCssSelectorStats } from '../src/parts/CssSelectorStats/CssSelectorStats.ts'

test('getCssSelectorStats aggregates selector stats trace events', () => {
  const result = getCssSelectorStats([
    {
      name: 'SelectorStats',
      args: {
        selector_stats: {
          selector_timings: [
            {
              'elapsed (us)': 1500,
              invalidation_count: 1,
              match_attempts: 7,
              match_count: 2,
              selector: '.quick-input',
              style_sheet_id: '1',
            },
            {
              'elapsed (us)': 500,
              invalidation_count: 0,
              match_attempts: 3,
              match_count: 1,
              selector: '.editor',
              style_sheet_id: '2',
            },
          ],
        },
      },
    },
    {
      name: 'SelectorStats',
      args: {
        selector_stats: {
          selector_timings: [
            {
              'elapsed (us)': 250,
              invalidation_count: 2,
              match_attempts: 5,
              match_count: 1,
              selector: '.quick-input',
              style_sheet_id: '1',
            },
          ],
        },
      },
    },
    {
      name: 'Layout',
      args: {},
    },
  ])

  expect(result.metrics).toEqual({
    invalidationCount: 3,
    matchAttempts: 15,
    matchCount: 4,
    styleRecalculationCount: 2,
    totalElapsedMs: 2.25,
  })
  expect(result.topSelectors).toEqual([
    {
      elapsedMs: 1.75,
      invalidationCount: 3,
      matchAttempts: 12,
      matchCount: 3,
      selector: '.quick-input',
      styleSheetId: '1',
    },
    {
      elapsedMs: 0.5,
      invalidationCount: 0,
      matchAttempts: 3,
      matchCount: 1,
      selector: '.editor',
      styleSheetId: '2',
    },
  ])
})

test('formatCssSelectorStatsSummary returns compact text', () => {
  const summary = formatCssSelectorStatsSummary({
    metrics: {
      invalidationCount: 1,
      matchAttempts: 7,
      matchCount: 2,
      styleRecalculationCount: 1,
      totalElapsedMs: 1.5,
    },
    topSelectors: [
      {
        elapsedMs: 1.5,
        invalidationCount: 1,
        matchAttempts: 7,
        matchCount: 2,
        selector: '.quick-input',
        styleSheetId: '1',
      },
    ],
  })

  expect(summary).toContain('CSS selector stats:')
  expect(summary).toContain('styleRecalculationCount | 1')
  expect(summary).toContain('.quick-input | 1.5 | 7 | 2 | 1')
})
