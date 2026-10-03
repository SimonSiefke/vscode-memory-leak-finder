import * as GetPoolmonData from '../GetPoolmonData/GetPoolmonData.ts'

export const name = 'poolmon'
export const multiple = true

export const getData = (basePath: string) => GetPoolmonData.getPoolmonData(basePath)

export const createChart = () => {
  return {
    fontSize: 12,
    marginLeft: 260,
    marginRight: 120,
    type: 'dual-bar-chart',
    width: 1000,
    yLabel: 'Process Memory (KiB)',
  }
}
