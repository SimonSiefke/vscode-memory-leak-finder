import { getData as getDiagnosticData } from '../GetPerformanceDiagnosticData/GetPerformanceDiagnosticData.ts'
export const name = 'script-compilation-evaluation'
export const multiple = true
export const getData = (basePath: string) => getDiagnosticData(basePath, 'script-compilation-evaluation', 'scriptCompilationEvaluation')
export const createChart = () => ({
  type: 'bar-chart',
  width: 1200,
  fontSize: 12,
  marginLeft: 440,
  marginRight: 120,
  x: 'value',
  y: 'name',
  xLabel: 'Value (unit in label)',
  yLabel: 'script-compilation-evaluation',
})
