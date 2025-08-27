import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

export const createBarChart = (data: any, options: any): string => {
  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    marginLeft: 90,
    marginRight: 90,
    x: { axis: null },
    y: { label: null },
    marks: [
      Plot.barX(data, {
        x: 'value',
        y: 'name',
      }),

      Plot.text(data, {
        text: 'value',
        y: 'name',
        x: 'value',
        textAnchor: 'start',
        dx: 3,
        stroke: 'black',
        strokeWidth: 0.5,
        fontSize: 7,
      }),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
