import * as GetEmitterCountData from '../GetEmitterCountData/GetEmitterCountData.ts'

export const name = 'emitter-count'

export const getData = (basePath: string) => GetEmitterCountData.getEmitterCountData(basePath)

export const createChart = () => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Emitter Count',
  }
}
