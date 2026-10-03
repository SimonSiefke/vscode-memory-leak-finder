import * as GetChromiumMemoryDumpData from '../GetChromiumMemoryDumpData/GetChromiumMemoryDumpData.ts'

export const name = 'chromium-memory-dump-allocators'

export const getData = GetChromiumMemoryDumpData.getChromiumMemoryDumpAllocatorData

export const createChart = () => ({
  subtitle: 'Top 40 allocator paths by absolute byte change. Hierarchical allocator rows are not additive.',
  title: 'Chromium allocator memory',
  type: 'memory-comparison-chart',
  width: 1400,
})

export const multiple = true
