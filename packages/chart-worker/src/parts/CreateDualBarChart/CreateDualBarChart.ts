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
      value: item.count, // total count
      type: 'total'
    },
    {
      name: item.name,
      value: item.delta, // leaked count
      type: 'leaked'
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
        fill: (d: any) => d.type === 'total' ? '#000000' : '#FF0000', // black for total, red for leaked
        sort: {
          y: '-x',
        },
      }),

      // Add text label for TOTAL count only at the end of the total bar
      Plot.text(transformedData.filter((d: any) => d.type === 'total'), {
        text: (d: any) => d.value + (data.find((item: any) => item.name === d.name)?.delta || 0), // Show the actual total count value
        y: 'name',
        x: (d: any) => d.value + (data.find((item: any) => item.name === d.name)?.delta || 0), // Position at the end of the total bar
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
