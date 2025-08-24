import * as GetNamedFunctionCountData3 from '../GetNamedFunctionCountData3/GetNamedFunctionCountData3.ts'

export const name = 'named-function-count-3'

export const getData = () => GetNamedFunctionCountData3.getNamedFunctionCountData3('CodeLensModel')

export const createChart = () => {
  return {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'CodeLensModel Count',
  }
}
