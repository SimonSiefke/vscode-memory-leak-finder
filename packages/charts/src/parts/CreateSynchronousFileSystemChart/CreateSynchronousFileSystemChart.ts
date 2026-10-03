import { getData as getDiagnosticData } from '../GetPerformanceDiagnosticData/GetPerformanceDiagnosticData.ts'
export const name = 'synchronous-file-system'
export const multiple = true
export const getData = (basePath: string) => getDiagnosticData(basePath, 'synchronous-file-system', 'synchronousFileSystem')
export const createChart = () => ({
  type: 'bar-chart',
  width: 1200,
  fontSize: 12,
  marginLeft: 440,
  marginRight: 120,
  x: 'value',
  y: 'name',
  xLabel: 'Value (unit in label)',
  yLabel: 'synchronous-file-system',
})
