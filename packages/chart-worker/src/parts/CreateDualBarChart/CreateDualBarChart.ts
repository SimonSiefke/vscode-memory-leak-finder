import { addRowHighlights } from '../AddRowHighlights/AddRowHighlights.ts'
import { addOmittedEntriesFooter } from '../AddOmittedEntriesFooter/AddOmittedEntriesFooter.ts'
import { fixSvgHeight } from '../FixSvgHeight/FixSvgHeight.ts'
import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import { getCommonBarChartOptions } from '../GetCommonBarChartOptions/GetCommonBarChartOptions.ts'
import * as Plot from '../Plot/Plot.ts'

export const createDualBarChart = (data: any, options: any): string => {
  const orderedData = [...data]
    .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
    .map((item: any, index: number) => ({ ...item, row: String(index) }))
  const dataCount = orderedData.length
  const chartOptions = getCommonBarChartOptions(dataCount, {
    ...options,
    // marginTop: 150, // Override marginTop for dual bar chart
  })

  // Transform data to have separate entries for initial and leaked counts
  const transformedData = orderedData.flatMap((item: any) => [
    {
      row: item.row,
      type: 'initial',
      value: item.count - item.delta, // initial count (total - leaked)
    },
    {
      row: item.row,
      type: 'leaked',
      value: item.delta, // leaked count
    },
  ])

  const baseHtml = Plot.plot({
    height: chartOptions.height,
    marginLeft: chartOptions.marginLeft,
    marginRight: chartOptions.marginRight,
    marginTop: 0,
    marks: [
      Plot.rectX(transformedData, {
        fill: (d: any) => (d.type === 'initial' ? '#000000' : '#B22222'), // black for initial, firebrick red for leaked
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        x: 'value',
        y: 'row',
      }),

      // Use the original entries so repeated names retain their own totals.
      Plot.text(orderedData, {
        dx: 3,
        fill: 'black',
        fontSize: chartOptions.fontSize - 3,
        text: 'count',
        textAnchor: 'start',
        x: 'count',
        y: 'row',
      }),
    ],
    style: 'overflow: visible;background:white',
    width: chartOptions.width,
    // marginBottom: 'auto',
    x: { axis: null },

    // Process names are display labels, not unique row identifiers.
    y: { domain: orderedData.map((item: any) => item.row), label: null, tickFormat: (row: string) => orderedData[Number(row)].name },
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  const resizedHtml = fixSvgHeight(finalHtml, dataCount)
  const highlightedHtml = addRowHighlights(resizedHtml, orderedData, chartOptions, options)
  return addOmittedEntriesFooter(highlightedHtml, options)
}
