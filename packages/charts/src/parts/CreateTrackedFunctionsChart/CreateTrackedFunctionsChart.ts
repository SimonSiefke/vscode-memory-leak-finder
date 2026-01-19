// @ts-nocheck
import * as GetTrackedFunctionsData from '../GetTrackedFunctionsData/GetTrackedFunctionsData.ts'

export const name = 'tracked-functions'

export const getData = (basePath: string): Promise<any[]> => GetTrackedFunctionsData.getTrackedFunctionsData(basePath)

export const createChart = (data) => {
  const baseHtml = Plot.plot({
    labelArrow: false,
    marginLeft: 150,
    marks: [
      Plot.rectX(data, {
        fill: 'black',
        fillOpacity: 0.75,
        inset: 3,
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        x: 'totalCount',
        y: 'name',
      }),
      Plot.axisY({
        dx: 5,
        fill: 'black',
        fontSize: 7,
        textAnchor: 'end',
        tickSize: 0,
      }),
      Plot.axisX({
        fontSize: 8,
        tickSize: 0,
      }),
    ],
    style: 'overflow: visible;background:white',
    x: {
      inset: 0,
      label: 'Total Count',
    },
    y: {
      domain: data.map((d) => d.name),
      inset: 0,
      label: 'Function Name',
    },
  }).outerHTML
  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
