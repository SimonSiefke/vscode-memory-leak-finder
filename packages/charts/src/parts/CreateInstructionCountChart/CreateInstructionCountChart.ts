export { getInstructionCountData as getData } from '../GetInstructionCountData/GetInstructionCountData.ts'

export const name = 'instruction-count'
export const multiple = true
export const createChart = () => ({
  fontSize: 12,
  marginLeft: 480,
  marginRight: 180,
  type: 'bar-chart',
  width: 1400,
  x: 'value',
  xLabel: 'User-space instructions per scenario',
  y: 'name',
  yLabel: 'Test',
})
