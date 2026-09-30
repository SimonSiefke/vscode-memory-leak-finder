import { getData as getDiagnosticData } from '../GetPerformanceDiagnosticData/GetPerformanceDiagnosticData.ts'
export const name = 'cpu-profile-summary'
export const multiple = true
export const getData = (basePath: string) => getDiagnosticData(basePath, 'cpu-profile', 'cpuProfile')
export const createChart = () => ({
  type: 'bar-chart',
  width: 1200,
  fontSize: 12,
  marginLeft: 440,
  marginRight: 120,
  x: 'value',
  y: 'name',
  xLabel: 'Value (unit in label)',
  yLabel: 'cpu-profile-summary',
})
