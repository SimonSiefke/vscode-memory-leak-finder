import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import { fixSvgHeight } from '../FixSvgHeight/FixSvgHeight.ts'
import { getCommonBarChartOptions } from '../GetCommonBarChartOptions/GetCommonBarChartOptions.ts'
import * as Plot from '../Plot/Plot.ts'

export const createDualBarChart = (data: any, options: any): string => {
  const dataCount = data.length
  const chartOptions = getCommonBarChartOptions(dataCount, {
    ...options,
    // marginTop: 150, // Override marginTop for dual bar chart
  })

  // Transform data to have separate entries for initial and leaked counts
  const transformedData = data.flatMap((item: any) => [
    {
      name: item.name,
      value: item.count - item.delta, // initial count (total - leaked)
      type: 'initial',
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
    marginTop: 0,
    // marginBottom: 'auto',
    x: { axis: null },
    y: { label: null },

    marks: [
      Plot.rectX(transformedData, {
        x: 'value',
        y: 'name',
        fill: (d: any) => (d.type === 'initial' ? '#000000' : '#B22222'), // black for initial, firebrick red for leaked
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        sort: {
          y: '-x',
        },
      }),

      // Add text label for TOTAL count only at the end of the total bar
      Plot.text(
        transformedData.filter((d: any) => d.type === 'initial'),
        {
          text: (d: any) => data.find((item: any) => item.name === d.name)?.count || 0, // Show the actual total count value
          y: 'name',
          x: (d: any) => data.find((item: any) => item.name === d.name)?.count || 0, // Position at the end of the total bar
          textAnchor: 'start',
          dx: 3,
          fill: 'black',
          fontSize: chartOptions.fontSize - 3,
        },
      ),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return fixSvgHeight(finalHtml, dataCount)
}
