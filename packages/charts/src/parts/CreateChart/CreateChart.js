import * as Plot from '../Plot/Plot.js'

export const createChart = (data) => {
  // TODO
  const linedata = [
    { hour: 0, value: 8, sensor: 'A' },
    { hour: 0, value: 6, sensor: 'B' },
    { hour: 1, value: 7, sensor: 'A' },
    { hour: 1, value: 5, sensor: 'B' },
    { hour: 2, value: 3, sensor: 'A' },
    { hour: 2, value: 0, sensor: 'B' },
    { hour: 3, value: 9, sensor: 'A' },
    { hour: 3, value: 2, sensor: 'B' },
  ]

  const l = Plot.lineY(linedata, { x: 'hour', y: 'value', stroke: 'sensor' }).plot()

  return l.outerHTML
}
