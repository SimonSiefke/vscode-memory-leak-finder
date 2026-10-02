import { getData as getDiagnosticData } from '../GetPerformanceDiagnosticData/GetPerformanceDiagnosticData.ts'
export const name = 'event-loop-delay'
export const multiple = true
export const getData = (basePath: string) => getDiagnosticData(basePath, 'event-loop-delay', 'eventLoopDelay')
export const createChart = () => ({
  type: 'bar-chart',
  width: 1200,
  fontSize: 12,
  marginLeft: 440,
  marginRight: 120,
  x: 'value',
  y: 'name',
  xLabel: 'Value (unit in label)',
  yLabel: 'event-loop-delay',
})
