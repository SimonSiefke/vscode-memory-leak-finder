// @ts-nocheck
import * as GetNamedFunctionCountData from '../GetNamedFunctionCountData/GetNamedFunctionCountData.ts'

export const name = 'named-function-count'

export const getData = (basePath: string) => GetNamedFunctionCountData.getNamedFunctionCountData(basePath)

export const skip = 1

export const createChart = (data) => {
  // TODO
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
        x: 'delta',
        y: 'name',
        // y1: 55,
      }),
      Plot.axisY({
        dx: 5,
        fill: 'black',
        fontSize: 7,
        textAnchor: 'end',
        tickSize: 0,
      }),
      Plot.axisX({
        // textAnchor: 'end',
        // fill: 'black',
        fontSize: 8,
        tickSize: 0,
        // dx: 5,
      }),
      // Plot.axisY({ label: 'Responses (%)' }),
      // Plot.text(data, {
      //   x: 'delta',
      //   y: 'name',
      //   text: 'name',
      //   textAnchor: 'end',
      //   dx: -3,
      //   fill: 'snow',
      //   fontSize: 3,
      //   fontWeight: 400,
      //   dy: 0,
      // }),
      // Plot.text(data, {
      //   x: 'delta',
      //   y: 'name',
      //   text: (data, index) => {
      //     return `Delta: ${data.delta}`
      //   },
      //   textAnchor: 'end',
      //   dx: -3,
      //   fill: 'snow',
      //   fontSize: 3,
      //   fontWeight: 400,
      //   dy: 3,
      // }),
      // Plot.text(data, {
      //   x: 'delta',
      //   y: 'name',
      //   text: (data, index) => {
      //     return `src/vs/base/common/myfile.ts:21`
      //   },
      //   textAnchor: 'end',
      //   dx: -3,
      //   fill: 'snow',
      //   fontSize: 1.5,
      //   fontWeight: 400,
      //   dy: -3,
      // }),
    ],
    // zer
    // axis: 'top',

    style: 'overflow: visible;background:white',
    x: {
      inset: 0,
      label: 'Count',
    },
    y: {
      domain: data.map((d) => d.name),
      inset: 0,
      // grid: true,
      label: 'Name',

      // padding: 20,
    },
  }).outerHTML
  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
