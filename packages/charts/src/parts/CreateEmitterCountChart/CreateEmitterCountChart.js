import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetEmitterCountData from '../GetEmitterCountData/GetEmitterCountData.js'

export const name = 'emitter-count'

export const getData = GetEmitterCountData.getEmitterCountData

export const createChart = (data) => {
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Emitter Count',
  })
}
