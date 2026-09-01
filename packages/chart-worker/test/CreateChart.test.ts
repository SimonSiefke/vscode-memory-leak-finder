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
  expect(result).toContain('y="30.5"')
  expect(result).toContain('height="45"')
})

test('memory comparison chart renders growth, shrinkage, byte formatting, inspected rows, and omissions', async () => {
  const result = await createChart(
    [
      {
        afterBytes: 3 * 1024 * 1024,
        beforeBytes: 2 * 1024 * 1024,
        deltaBytes: 1024 * 1024,
        detail: 'Peak RSS: 4 MiB',
        isInspected: true,
        name: 'Renderer (PID 12)',
      },
      {
        afterBytes: 512 * 1024,
        beforeBytes: 1024 * 1024,
        deltaBytes: -512 * 1024,
        name: 'GPU Process (PID 13)',
      },
    ],
    {
      omittedEntryCount: 7,
      subtitle: 'Hierarchical allocator rows are not additive.',
      title: 'Chromium memory',
      type: 'memory-comparison-chart',
    },
  )

  expect(result).toContain('Chromium memory')
  expect(result).toContain('Hierarchical allocator rows are not additive.')
  expect(result).toContain('data-row-label="Renderer (PID 12)"')
  expect(result).toContain('+1.00 MiB')
  expect(result).toContain('-512 KiB')
  expect(result).toContain('inspected renderer')
  expect(result).toContain('7 rows omitted')
  expect(result).toContain('Peak RSS: 4 MiB')
})

test('memory comparison chart renders an empty result', async () => {
  const result = await createChart([], { type: 'memory-comparison-chart' })

  expect(result).toContain('No comparable memory rows')
})

test('bar chart keeps two CPU performance counter rows inside the viewBox', async () => {
  const result = await createChart(
    [
      { name: 'instructions', value: 123_456_789 },
      { name: 'cycles', value: 98_765_432 },
    ],
    {
      fontSize: 12,
      marginLeft: 160,
      marginRight: 220,
      type: 'bar-chart',
      width: 900,
    },
  )

  expect(result).toContain('height="60"')
  expect(result).toContain('viewBox="0 0 900 60"')
  expect(result).toContain('V54')
  expect(result).toContain(',56H')
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
  expect(result).toContain('y="22.5"')
  expect(result).toContain('height="14"')
})

test('dual bar chart centers a highlight within the rendered row', async () => {
  const result = await createChart(
    Array.from({ length: 14 }, (_, index) => ({
      count: 14 - index,
      delta: 1,
      name: index === 5 ? 'gone' : `kept-${index}`,
    })),
    {
      highlightLabels: ['gone'],
      type: 'dual-bar-chart',
    },
  )

  const highlightTag = result.match(/<rect[^>]*data-highlight-label="gone"[^>]*>/)?.[0]
  expect(highlightTag).toBeDefined()

  const highlightY = Number(highlightTag?.match(/\by="([^"]+)"/)?.[1])
  const highlightHeight = Number(highlightTag?.match(/\bheight="([^"]+)"/)?.[1])
  const highlightCenter = highlightY + highlightHeight / 2
  expect(highlightCenter).toBe(103)
  expect(highlightY - 1.5).toBe(95)
  expect(highlightY + highlightHeight + 1.5).toBe(111)
})

test('dual bar chart keeps a last-row highlight inside the resized viewBox', async () => {
  const result = await createChart(
    Array.from({ length: 14 }, (_, index) => ({
      count: 14 - index,
      delta: 1,
      name: index === 13 ? 'gone' : `kept-${index}`,
    })),
    {
      highlightLabels: ['gone'],
      type: 'dual-bar-chart',
    },
  )

  const svgTag = result.match(/^<svg[^>]*>/)?.[0]
  const highlightTag = result.match(/<rect[^>]*data-highlight-label="gone"[^>]*>/)?.[0]
  expect(svgTag).toBeDefined()
  expect(highlightTag).toBeDefined()

  const svgHeight = Number(svgTag?.match(/\bheight="([^"]+)"/)?.[1])
  const highlightY = Number(highlightTag?.match(/\by="([^"]+)"/)?.[1])
  const highlightHeight = Number(highlightTag?.match(/\bheight="([^"]+)"/)?.[1])
  expect(highlightY + highlightHeight).toBeLessThan(svgHeight)
})

test('dual bar chart renders omitted entries footer', async () => {
  const result = await createChart(
    [
      { count: 5, delta: 1, name: 'kept' },
      { count: 3, delta: 1, name: 'gone' },
    ],
    {
      omittedEntryCount: 3213,
      type: 'dual-bar-chart',
    },
  )

  expect(result).toContain('3213 entries omitted for brevity')
  expect(result).toContain('height="68"')
  expect(result).toContain('viewBox="0 0 640 68"')
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
  expect(result).not.toContain('entries omitted for brevity')
})

test('grouped horizontal bar chart renders omitted entries footer', async () => {
  const result = await createChart(
    [
      { collected: 12, created: 10, name: 'src/a.ts' },
      { collected: 2, created: 4, name: 'src/b.ts' },
    ],
    {
      omittedEntryCount: 3,
      type: 'grouped-horizontal-bar-chart',
    },
  )

  expect(result).toContain('3 entries omitted for brevity')
  expect(result).toContain('height="116"')
  expect(result).toContain('viewBox="0 0 640 116"')
})

test('compiled code size chart renders stacked bytes, totals, deltas, and omitted entries', async () => {
  const result = await createChart(
    [
      {
        after: {
          bytecodeBytes: 1024,
          instructionBytes: 2048,
          metadataBytes: 1024,
          totalBytes: 4096,
        },
        before: {
          bytecodeBytes: 512,
          instructionBytes: 1024,
          metadataBytes: 512,
          totalBytes: 2048,
        },
        delta: {
          bytecodeBytes: 512,
          instructionBytes: 1024,
          metadataBytes: 512,
          totalBytes: 2048,
        },
        name: 'render&lt;Workbench&gt; (src/workbench.ts:10:2)',
      },
    ],
    {
      omittedEntryCount: 5,
      title: 'Largest compiled-code functions',
      type: 'compiled-code-size-chart',
      width: 1200,
    },
  )

  expect(result).toContain('Largest compiled-code functions')
  expect(result).toContain('Bytecode')
  expect(result).toContain('Native instructions')
  expect(result).toContain('Metadata')
  expect(result).toContain('4.0 KiB')
  expect(result).toContain('(+2.0 KiB)')
  expect(result).toContain('render&amp;lt;Workbench&amp;gt;')
  expect(result).toContain('5 entries omitted for brevity')
})

test('allocation performance chart renders churn and source CPU correlation', async () => {
  const result = await createChart(
    [
      {
        collectedCount: 8,
        createdCount: 10,
        name: 'src/a<&>.ts',
        retainedCount: 2,
        sourceSelfTimeMs: 4.5,
        sourceSelfTimePercent: 45,
      },
    ],
    {
      omittedEntryCount: 3,
      type: 'allocation-performance-chart',
      width: 1200,
    },
  )

  expect(result).toContain('Allocation churn and sampled JavaScript CPU self-time by source file')
  expect(result).toContain('src/a&lt;&amp;&gt;.ts')
  expect(result).toContain('created 10')
  expect(result).toContain('collected 8, retained 2')
  expect(result).toContain('4.5 ms (45%)')
  expect(result).toContain('3 entries omitted for brevity')
})

test('line chart renders connected load event points', async () => {
  const result = await createChart(
    [
      { runIndex: 1, value: 42 },
      { runIndex: 0, value: 35 },
    ],
    {
      type: 'line-chart',
      x: 'runIndex',
      xLabel: 'Run',
      y: 'value',
      yLabel: 'loadEventEnd (ms)',
    },
  )

  expect(result).toContain('loadEventEnd (ms)')
  expect(result).toContain('35 ms')
  expect(result).toContain('42 ms')
  expect(result).toContain('aria-label="line"')
  expect(result).toContain('aria-label="dot"')
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

test('paint events chart renders document paint groups, selector breakdowns, and region thumbnails', async () => {
  const result = await createChart(
    [
      {
        averageDurationMs: 2.5,
        averagePaintedArea: 120,
        components: [
          {
            averageArea: 20,
            averageDurationMs: 1,
            count: 2,
            height: 5,
            rects: [{ area: 20, height: 5, selector: 'div.slider', width: 4, x: 1, y: 2 }],
            selector: 'div.slider',
            width: 4,
            x: 1,
            y: 2,
          },
        ],
        count: 2,
        id: 'paint-abc123',
        name: 'paint-abc123 div.slider',
        paintCount: 4,
        rects: [{ area: 20, height: 5, selector: 'div.slider', width: 4, x: 1, y: 2 }],
        sampleIndexes: [1, 2],
        sampleStartMs: 10,
        selectorSummary: 'div.slider',
        totalDurationMs: 5,
      },
    ],
    {
      type: 'paint-events-chart',
      width: 1180,
    },
  )

  expect(result).toContain('Paint Events')
  expect(result).toContain('paint-abc123')
  expect(result).toContain('div.slider 4x5 @ 1,2')
  expect(result).toContain('2.500 ms avg')
  expect(result).toContain('<title>div.slider 4x5 @ 1,2</title>')
})
