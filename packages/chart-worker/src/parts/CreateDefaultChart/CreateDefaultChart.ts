import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

<<<<<<< HEAD
export const createDefaultChart = (data: any[], { x, xLabel, y, yLabel }: { x: string | number; xLabel: string; y: string | number; yLabel: string }) => {
=======
export const createDefaultChart = (
  data: any[],
  { x, xLabel, y, yLabel }: { x: string | number; xLabel: string; y: string | number; yLabel: string },
) => {
>>>>>>> origin/main
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
