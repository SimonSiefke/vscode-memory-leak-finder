import * as GetNamedFunctionCountData3 from '../GetNamedFunctionCountData3/GetNamedFunctionCountData3.ts'

export const name = 'named-function-count-3'

export const getData = (basePath: string) => GetNamedFunctionCountData3.getNamedFunctionCountData3('named-function-count3', basePath)

export const createChart = () => {
  return {
    type: 'dual-bar-chart',
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Function Counts',
    width: 1400,
    marginLeft: 500,
    marginRight: 500,
    fontSize: 12,
  }
}

export const multiple = true
