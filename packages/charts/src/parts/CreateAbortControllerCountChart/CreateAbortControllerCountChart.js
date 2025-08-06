import * as GetAbortControllerCountData from '../GetAbortControllerCountData/GetAbortControllerCountData.js'

export const name = 'abort-controller-count'

export const getData = GetAbortControllerCountData.getAbortControllerCountData

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'AbortController Count',
  }
}
