import * as Plot from '../Plot/Plot.js'

export const createChart = (data, options) => {
  const l = Plot.lineY(data, options).plot()
  return l.outerHTML
}
