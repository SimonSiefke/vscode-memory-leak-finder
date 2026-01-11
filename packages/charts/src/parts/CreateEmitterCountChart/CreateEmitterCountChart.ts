import * as GetEmitterCountData from '../GetEmitterCountData/GetEmitterCountData.ts'

export const name = 'emitter-count'

export const getData = (basePath: string): Promise<any[]> => GetEmitterCountData.getEmitterCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Emitter Count',
  }
}
