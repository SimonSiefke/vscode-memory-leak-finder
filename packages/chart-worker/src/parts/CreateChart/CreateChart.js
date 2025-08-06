import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.js'
import * as Plot from '../Plot/Plot.js'

export const createChart = (data, { x, y, xLabel, yLabel }) => {
  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    marginLeft: 60,
    y: {
      grid: true,
      label: yLabel,
    },
    x: {
      label: xLabel,
    },
    marks: [Plot.lineY(data, { x, y })],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
