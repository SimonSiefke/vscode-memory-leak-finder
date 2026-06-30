import { expect, test } from '@jest/globals'
import { createChart } from '../src/parts/CreateChart/CreateChart.ts'

test('main', async () => {
  const data: any[] = []
  const options = {
    x: 0,
    xLabel: 'X',
    y: 0,
    yLabel: 'Y',
  }
  expect(await createChart(data, options))
    .toBe(`<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" class=\"plot-d6a7b5\" fill=\"currentColor\" font-family=\"system-ui, sans-serif\" font-size=\"10\" text-anchor=\"middle\" width=\"640\" height=\"400\" viewBox=\"0 0 640 400\" style=\"overflow: visible; background: white;\"><style>:where(.plot-d6a7b5) {
  --plot-background: white;
  display: block;
  height: auto;
  height: intrinsic;
  max-width: 100%;
}
:where(.plot-d6a7b5 text),
:where(.plot-d6a7b5 tspan) {
  white-space: pre;
}</style><g aria-label=\"y-axis label\" text-anchor=\"start\" transform=\"translate(-57,-17)\"><text y=\"0.71em\" transform=\"translate(60,20)\">Y</text></g><g aria-label=\"x-axis label\" text-anchor=\"end\" transform=\"translate(17,27)\"><text transform=\"translate(620,370)\">X</text></g></svg>`)
})

test('bar chart highlights missing rows with full-width non-overlapping row boxes', async () => {
  const result = await createChart(
    [
      { name: 'kept', value: 5 },
      { name: 'gone-1', value: 3 },
      { name: 'gone-2', value: 2 },
    ],
    {
      highlightLabels: ['gone-1', 'gone-2'],
      type: 'bar-chart',
    },
  )

  expect(result).toContain('aria-label="fixed-row-highlights"')
  expect(result).toContain('data-highlight-label="gone-1|gone-2"')
  expect(result).toContain('x="8"')
  expect(result).toContain('width="624"')
  expect(result).toMatch(/height="53\.333/)
})

test('dual bar chart highlights by row name instead of value', async () => {
  const result = await createChart(
    [
      { count: 5, delta: 1, name: 'kept' },
      { count: 3, delta: 1, name: 'gone' },
    ],
    {
      highlightLabels: ['gone'],
      type: 'dual-bar-chart',
    },
  )

  expect(result).toContain('data-highlight-label="gone"')
  expect(result).toContain('height="30"')
})

test('grouped horizontal bar chart renders created and collected counts with row highlights', async () => {
  const result = await createChart(
    [
      { collected: 12, created: 10, name: 'src/a.ts' },
      { collected: 2, created: 4, name: 'src/b.ts' },
    ],
    {
      highlightLabels: ['src/a.ts'],
      type: 'grouped-horizontal-bar-chart',
    },
  )

  expect(result).toContain('Created and collected allocations by file')
  expect(result).toContain('src/a.ts')
  expect(result).toContain('created 10')
  expect(result).toContain('collected 12')
  expect(result).toContain('data-highlight-label="src/a.ts"')
  expect(result).toContain('aria-label="fixed-row-highlights"')
})

test('cpu profile flame chart renders frames, ticks, labels, and tooltips', async () => {
  const result = await createChart(
    [
      {
        colorKey: 'file:///workbench.js:10:4',
        depth: 0,
        durationMs: 2,
        hitCount: 1,
        location: 'file:///workbench.js:10:4',
        name: 'render<Workbench>',
        selfTimeMs: 2,
        startMs: 0,
        totalTimeMs: 5,
      },
      {
        colorKey: 'file:///workbench.js:10:4',
        depth: 0,
        durationMs: 3,
        hitCount: 1,
        location: 'file:///workbench.js:10:4',
        name: 'render<Workbench>',
        selfTimeMs: 2,
        startMs: 2,
        totalTimeMs: 5,
      },
      {
        colorKey: 'file:///layout.js:20:2',
        depth: 1,
        durationMs: 3,
        hitCount: 1,
        location: 'file:///layout.js:20:2',
        name: 'layout',
        selfTimeMs: 3,
        startMs: 2,
        totalTimeMs: 3,
      },
    ],
    {
      headerHeight: 72,
      rowHeight: 18,
      type: 'cpu-profile-flame-chart',
      width: 400,
    },
  )

  expect(result).toContain('CPU Profile Flame Chart')
  expect(result).toContain('5 ms')
  expect(result).toContain('render&lt;Workbench&gt;')
  expect(result).toContain('Location: file:///workbench.js:10:4')
  expect(result).toContain('data-frame="0"')
  expect(result).toContain('data-frame="1"')
  expect(result).not.toContain('data-frame="2"')
})
