import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

export const createDefaultChart = (
  data: any[],
  {
    marginLeft = 70,
    x,
    xLabel,
    y,
    yLabel,
  }: { marginLeft?: number; x: string | number; xLabel: string; y: string | number; yLabel: string },
) => {
  const baseHtml = Plot.plot({
    marginLeft,
    marks: [Plot.lineY(data, { stroke: 'black', x, y })],
    style: { overflow: 'visible', background: 'white', fontSize: '13px' },
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
