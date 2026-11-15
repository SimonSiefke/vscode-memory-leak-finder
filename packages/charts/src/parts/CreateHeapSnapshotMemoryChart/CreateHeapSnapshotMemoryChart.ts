import * as GetHeapSnapshotMemoryData from '../GetHeapSnapshotMemoryData/GetHeapSnapshotMemoryData.ts'

export const name = 'heap-snapshot-memory'
export const multiple = true
export const getData = (basePath: string): Promise<any[]> => GetHeapSnapshotMemoryData.getHeapSnapshotMemoryData(basePath)
export const createChart = () => ({
  type: 'line-chart',
  width: 900,
  fontSize: 12,
  marginLeft: 70,
  marginRight: 40,
  x: 'runIndex',
  xLabel: 'Scenario run (0 = baseline)',
  y: 'value',
  yLabel: 'Renderer heap self-size (bytes)',
})
