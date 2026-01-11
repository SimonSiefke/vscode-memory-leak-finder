import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

export const createDefaultChart = (
  data: any[],
  { x, xLabel, y, yLabel }: { x: string | number; xLabel: string; y: string | number; yLabel: string },
) => {
  const baseHtml = Plot.plot({
    marginLeft: 60,
    marks: [Plot.lineY(data, { stroke: 'black', x, y })],
    style: 'overflow: visible;background:white',
    x: {
      label: xLabel,
    },
    y: {
      grid: true,
      label: yLabel,
    },
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
