import * as GetEmitterCountData from '../GetEmitterCountData/GetEmitterCountData.ts'

export const name = 'emitter-count'

export const getData = GetEmitterCountData.getEmitterCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Emitter Count',
  }
}
