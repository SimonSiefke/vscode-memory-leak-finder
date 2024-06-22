import * as Plot from '../Plot/Plot.js'

export const createChart = (data, { x, y, xLabel, yLabel }) => {
  const baseHtml = Plot.plot({
    style: 'overflow: visible;background:white',
    marginLeft: 60,
    y: {
      grid: true,
      label: yLabel,
    },
    x: {
      label: xLabel,
    },
    marks: [Plot.lineY(data, { x, y })],
  }).outerHTML
  const finalHtml = baseHtml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" ')
  return finalHtml
}
