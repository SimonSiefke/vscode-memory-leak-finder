import * as GetEditContextCountData from '../GetEditContextCountData/GetEditContextCountData.ts'

export const name = 'edit-context-count'

export const getData = GetEditContextCountData.getEditContextCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Edit Context Count',
  }
}
