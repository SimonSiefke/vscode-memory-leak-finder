import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

export const createBarChart = (data: any, options: any): string => {
  console.log({ data })
  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:orange',
    marginLeft: 90,
    marginRight: 90,
    x: { axis: null },
    y: { label: null },
    marks: [
      Plot.barX(data, {
        x: 'value',
        y: 'name',
        // sort: { y: 'x', reverse: true },
      }),

      Plot.text(data, {
        text: 'value',
        y: 'name',
        x: 'value',
        textAnchor: 'start',
        dx: 3,
        stroke: 'red',
      }),

      // Plot.text(data, {
      //   text: (d) => `${Math.floor(d.value / 1000)} B`,
      //   y: 'name',
      //   x: 'value',
      //   textAnchor: 'end',
      //   dx: -3,
      //   fill: 'white',
      // }),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
