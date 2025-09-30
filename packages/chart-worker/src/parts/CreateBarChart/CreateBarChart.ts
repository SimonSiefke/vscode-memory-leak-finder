import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

export const createBarChart = (data: any, options: any): string => {
  const marginLeft = options.marginLeft || 250
  const marginRight = options.marginRight || 250
  const fontSize = options.fontSize || 7
  const width = options.width || 640

  const dataCount = data.length
  const lineHeight = fontSize + 6
  const marginTop = 30
  const marginBottom = 30
  const height = dataCount * lineHeight + marginTop + marginBottom

  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    width,
    height,
    marginLeft: marginLeft,
    marginRight: marginRight,
    x: { axis: null },
    y: { label: null },
    marks: [
      Plot.barX(data, {
        x: 'value',
        y: 'name',
        fill: 'black',
        sort: {
          y: '-x',
        },
      }),

      Plot.text(data, {
        text: 'value',
        y: 'name',
        x: 'value',
        textAnchor: 'start',
        dx: 3,
        stroke: 'black',
        strokeWidth: 0.5,
        fontSize: fontSize,
      }),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
