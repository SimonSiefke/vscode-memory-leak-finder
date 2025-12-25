import * as GetEditContextCountData from '../GetEditContextCountData/GetEditContextCountData.ts'

export const name = 'edit-context-count'

export const getData = (basePath: string): Promise<any[]> => GetEditContextCountData.getEditContextCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Edit Context Count',
  }
}
