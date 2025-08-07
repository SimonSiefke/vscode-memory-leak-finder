// @ts-nocheck
import { fixHtmlNamespace } from '../FixXmlNamespace/FixXmlNamespace.ts'
import * as GetNamedFunctionCountData from '../GetNamedFunctionCountData/GetNamedFunctionCountData.ts'

export const name = 'named-function-count'

export const getData = GetNamedFunctionCountData.getNamedFunctionCountData

export const skip = 1

export const createChart = (data) => {
  // TODO
  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    marginLeft: 150,
    labelArrow: false,
    // zer
    // axis: 'top',

    y: {
      // grid: true,
      label: 'Name',
      domain: data.map((d) => d.name),
      inset: 0,

      // padding: 20,
    },
    x: {
      label: 'Count',
      inset: 0,
    },
    marks: [
      Plot.rectX(data, {
        x: 'delta',
        y: 'name',
        fill: 'black',
        rx1: 2,
        rx2: 2,
        strokeWidth: 2,
        fillOpacity: 0.75,
        inset: 3,
        // y1: 55,
      }),
      Plot.axisY({
        textAnchor: 'end',
        fill: 'black',
        fontSize: 7,
        tickSize: 0,
        dx: 5,
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
  }).outerHTML
  const finalHtml = fixHtmlNamespace(baseHtml)
  return finalHtml
}
