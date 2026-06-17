import * as GetTrackedFunctionsData from '../GetTrackedFunctionsData/GetTrackedFunctionsData.ts'

export const name = 'tracked-functions'

export const getData = (basePath: string): Promise<any[]> => GetTrackedFunctionsData.getTrackedFunctionsData(basePath)

export const createChart = (): {
  fontSize: number
  marginLeft: number
  marginRight: number
  type: string
  width: number
  x: string
  xLabel: string
  y: string
  yLabel: string
} => {
  return {
    fontSize: 12,
    marginLeft: 200,
    marginRight: 50,
    type: 'dual-bar-chart',
    width: 1200,
    x: 'value',
    xLabel: 'Call Count',
    y: 'name',
    yLabel: 'Function Name',
  }
}

export const multiple = true
