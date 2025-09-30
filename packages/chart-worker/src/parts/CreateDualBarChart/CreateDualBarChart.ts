import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as Plot from '../Plot/Plot.ts'

export const createDualBarChart = (data: any, options: any): string => {
  const marginLeft = options.marginLeft || 250
  const marginRight = options.marginRight || 250
  const fontSize = options.fontSize || 7
  const width = options.width || 640

  const dataCount = data.length
  const lineHeight = fontSize + 6
  const height = dataCount * lineHeight

  // Transform data to have separate entries for total and leaked counts
  const transformedData = data.flatMap((item: any) => [
    {
      name: item.name,
      value: item.count - item.delta, // before count (total - leaked)
      type: 'before',
      label: 'before'
    },
    {
      name: item.name,
      value: item.delta, // leaked count
      type: 'leaked',
      label: 'leaked'
    }
  ])

  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    width,
    height,
    marginLeft: marginLeft,
    marginRight: marginRight,
    x: { axis: null },
    y: { label: null },
    marks: [
      Plot.barX(transformedData, {
        x: 'value',
        y: 'name',
        fill: (d: any) => d.type === 'before' ? '#4A90E2' : '#E74C3C', // blue for before, red for leaked
        sort: {
          y: '-x',
        },
      }),

      Plot.text(transformedData, {
        text: 'value',
        y: 'name',
        x: 'value',
        textAnchor: 'start',
        dx: 3,
        stroke: 'black',
        strokeWidth: 0.5,
        fontSize: fontSize,
      }),

      // Add labels for each bar
      Plot.text(transformedData, {
        text: 'label',
        y: 'name',
        x: (d: any) => d.type === 'before' ? (d.value / 2) : (d.value / 2),
        textAnchor: 'middle',
        dy: -fontSize - 2,
        stroke: 'black',
        strokeWidth: 0.3,
        fontSize: fontSize - 1,
      }),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
