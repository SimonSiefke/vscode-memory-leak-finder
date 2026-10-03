import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

const formatValue = (value: number): string => {
  return `${Math.round((value + Number.EPSILON) * 1000) / 1000} ms`
}

export const createLineChart = (data: any[], options: any): string => {
  const orderedData = [...data].sort((a: any, b: any) => (a[options.x] || 0) - (b[options.x] || 0))
  const baseHtml = Plot.plot({
    height: options.height || 320,
    marginBottom: 44,
    marginLeft: options.marginLeft || 70,
    marginRight: options.marginRight || 40,
    marginTop: 24,
    marks: [
      Plot.lineY(orderedData, {
        stroke: 'black',
        strokeWidth: 2,
        x: options.x,
        y: options.y,
      }),
      Plot.dot(orderedData, {
        fill: 'white',
        r: 4,
        stroke: 'black',
        strokeWidth: 2,
        x: options.x,
        y: options.y,
      }),
      Plot.text(orderedData, {
        dy: -10,
        fontSize: options.fontSize || 12,
        text: (item: any) => formatValue(item[options.y]),
        x: options.x,
        y: options.y,
      }),
    ],
    style: 'overflow: visible; background:white',
    width: options.width || 900,
    x: {
      grid: true,
      label: options.xLabel,
      tickFormat: (value: number) => `${value + 1}`,
      ticks: orderedData.map((item: any) => item[options.x]),
    },
    y: {
      grid: true,
      label: options.yLabel,
    },
  }).outerHTML

  return fixHtmlNamespace(baseHtml)
}
