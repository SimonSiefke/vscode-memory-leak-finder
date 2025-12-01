import { expect, test } from '@jest/globals'
import { createChart } from '../src/parts/CreateChart/CreateChart.ts'

test('main', () => {
  const data = []
  const options = {
    x: 0,
    y: 0,
    xLabel: 'X',
    yLabel: 'Y',
  }
  expect(createChart(data, options))
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
