import * as GetNamedFunctionCountData3 from '../GetNamedFunctionCountData3/GetNamedFunctionCountData3.ts'

export const name = 'named-function-count-3'

export const getData = (basePath: string) => GetNamedFunctionCountData3.getNamedFunctionCountData3('named-function-count3', basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 500,
    marginRight: 500,
    type: 'dual-bar-chart',
    width: 1400,
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Function Counts',
  }
}

export const multiple = true
