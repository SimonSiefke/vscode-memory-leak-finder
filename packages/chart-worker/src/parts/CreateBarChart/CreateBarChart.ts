import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import { getCommonBarChartOptions } from '../GetCommonBarChartOptions/GetCommonBarChartOptions.ts'
import * as Plot from '../Plot/Plot.ts'

export const createBarChart = (data: any, options: any): string => {
  const dataCount = data.length
  const chartOptions = getCommonBarChartOptions(dataCount, options)

  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    width: chartOptions.width,
    height: chartOptions.height,
    marginLeft: chartOptions.marginLeft,
    marginRight: chartOptions.marginRight,
    marginTop: chartOptions.marginTop,
    marginBottom: chartOptions.marginBottom,
    x: { axis: null },
    y: { label: null },
    marks: [
      Plot.rectX(data, {
        x: 'value',
        y: 'name',
        fill: 'black',
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        fillOpacity: 0.75,
        inset: 0,
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
        fontSize: chartOptions.fontSize,
      }),
    ],
  }).outerHTML

  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
