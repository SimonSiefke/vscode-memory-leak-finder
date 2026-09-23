import * as GetPoolmonData from '../GetPoolmonData/GetPoolmonData.ts'

export const name = 'poolmon'
export const multiple = true

export const getData = (basePath: string) => GetPoolmonData.getPoolmonData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 160,
    marginRight: 60,
    type: 'bar-chart',
    width: 800,
  }
}
