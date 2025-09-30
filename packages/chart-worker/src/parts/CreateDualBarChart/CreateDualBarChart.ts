import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import { getCommonBarChartOptions } from '../GetCommonBarChartOptions/GetCommonBarChartOptions.ts'
import * as Plot from '../Plot/Plot.ts'

export const createDualBarChart = (data: any, options: any): string => {
  const dataCount = data.length
  const chartOptions = getCommonBarChartOptions(dataCount, {
    ...options,
    marginTop: 150, // Override marginTop for dual bar chart
  })

  // Transform data to have separate entries for total and leaked counts
  const transformedData = data.flatMap((item: any) => [
    {
      name: item.name,
      value: item.count, // total count
      type: 'total',
    },
    {
      name: item.name,
      value: item.delta, // leaked count
      type: 'leaked',
    },
  ])

  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    width: chartOptions.width,
    height: chartOptions.height,
    marginLeft: chartOptions.marginLeft,
    marginRight: chartOptions.marginRight,
    x: { axis: null },
    y: { label: null },
    marks: [
      Plot.rectX(transformedData, {
        x: 'value',
        y: 'name',
        fill: (d: any) => (d.type === 'total' ? '#000000' : '#B22222'), // black for total, firebrick red for leaked
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        fillOpacity: 0.75,
        inset: 3,
        y1: (d: any, i: number) => Math.floor(i / 2) * chartOptions.fixedBarHeight + chartOptions.marginTop,
        y2: (d: any, i: number) => (Math.floor(i / 2) + 1) * chartOptions.fixedBarHeight + chartOptions.marginTop,
        sort: {
          y: '-x',
        },
      }),

      // Add text label for TOTAL count only at the end of the total bar
      Plot.text(
        transformedData.filter((d: any) => d.type === 'total'),
        {
          text: (d: any) => d.value + (data.find((item: any) => item.name === d.name)?.delta || 0), // Show the actual total count value
          y: 'name',
          x: (d: any) => d.value + (data.find((item: any) => item.name === d.name)?.delta || 0), // Position at the end of the total bar
          textAnchor: 'start',
          dx: 3,
          stroke: 'black',
          strokeWidth: 0.5,
          fontSize: chartOptions.fontSize,
        },
      ),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
