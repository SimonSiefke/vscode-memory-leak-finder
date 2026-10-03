import * as GetConcatenatedErrorStringCountData from '../GetConcatenatedErrorStringCountData/GetConcatenatedErrorStringCountData.ts'

export const name = 'concatenated-error-string-count'

export const getData = (basePath: string): Promise<any[]> =>
  GetConcatenatedErrorStringCountData.getConcatenatedErrorStringCountData(basePath)

export const createChart = (): { x: string; xLabel: string; y: string; yLabel: string } => {
  return {
    x: 'index',
    xLabel: 'Index',
    y: 'count',
    yLabel: 'Concatenated Error String Count',
  }
}
