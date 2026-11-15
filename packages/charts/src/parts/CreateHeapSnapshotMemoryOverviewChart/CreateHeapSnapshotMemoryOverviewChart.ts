import { getHeapSnapshotMemoryOverviewData } from '../GetHeapSnapshotMemoryOverviewData/GetHeapSnapshotMemoryOverviewData.ts'

export const name = 'heap-snapshot-memory-overview'
export const getData = getHeapSnapshotMemoryOverviewData

export const createChart = () => ({
  marginLeft: 90,
  x: 'index',
  xLabel: 'Scenario Index',
  y: 'count',
  yLabel: 'Renderer heap self-size (bytes)',
})
