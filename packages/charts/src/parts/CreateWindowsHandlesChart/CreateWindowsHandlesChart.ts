import * as GetWindowsHandlesData from '../GetWindowsHandlesData/GetWindowsHandlesData.ts'

export const name = 'windows-handles'
export const multiple = true

export const getData = (basePath: string) => GetWindowsHandlesData.getWindowsHandlesData(basePath)

export const createChart = () => ({
  fontSize: 12,
  marginLeft: 260,
  marginRight: 120,
  type: 'dual-bar-chart',
  width: 1000,
  yLabel: 'Windows Handles',
})
