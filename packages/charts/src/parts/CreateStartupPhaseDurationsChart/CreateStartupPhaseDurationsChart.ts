import { getData as getDiagnosticData } from '../GetPerformanceDiagnosticData/GetPerformanceDiagnosticData.ts'
export const name = 'startup-phase-durations'
export const multiple = true
export const getData = (basePath: string) => getDiagnosticData(basePath, 'startup-phase-durations', 'startupPhaseDurations')
export const createChart = () => ({
  type: 'bar-chart',
  width: 1200,
  fontSize: 12,
  marginLeft: 440,
  marginRight: 120,
  x: 'value',
  y: 'name',
  xLabel: 'Value (unit in label)',
  yLabel: 'startup-phase-durations',
})
