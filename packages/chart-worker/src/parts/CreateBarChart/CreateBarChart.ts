import { addRowHighlights } from '../AddRowHighlights/AddRowHighlights.ts'
import { fixSvgHeight } from '../FixSvgHeight/FixSvgHeight.ts'
import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import { getCommonBarChartOptions } from '../GetCommonBarChartOptions/GetCommonBarChartOptions.ts'
import * as Plot from '../Plot/Plot.ts'

export const createBarChart = (data: any, options: any): string => {
  const orderedData = [...data].sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
  const dataCount = orderedData.length
  const chartOptions = getCommonBarChartOptions(dataCount, options)

  const baseHtml = Plot.plot({
    height: chartOptions.height,
    marginBottom: chartOptions.marginBottom,
    marginLeft: chartOptions.marginLeft,
    marginRight: chartOptions.marginRight,
    marginTop: chartOptions.marginTop,
    marks: [
      Plot.rectX(orderedData, {
        fill: 'black',
        fillOpacity: 0.75,
        inset: 0,
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        x: 'value',
        y: 'name',
      }),

      Plot.text(orderedData, {
        dx: 3,
        fontSize: chartOptions.fontSize,
        stroke: 'black',
        strokeWidth: 0.5,
        text: 'value',
        textAnchor: 'start',
        x: 'value',
        y: 'name',
      }),
    ],
    style: 'overflow: visible; background:white',
    width: chartOptions.width,
    x: { axis: null },
    y: { domain: orderedData.map((item: any) => item.name), label: null },
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  const resizedHtml = fixSvgHeight(finalHtml, dataCount)
  return addRowHighlights(resizedHtml, orderedData, chartOptions, options)
}
