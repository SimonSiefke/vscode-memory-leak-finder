import * as Plot from '../Plot/Plot.js'

export const createChart = (data, options) => {
  return Plot.plot({
    style: 'overflow: visible;background:white',
    marginLeft: 60,
    y: {
      grid: true,
      label: 'Function Count',
    },
    x: {
      label: 'Index',
    },
    marks: [Plot.lineY(data, options)],
  }).outerHTML
}
