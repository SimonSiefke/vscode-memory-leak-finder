import * as GetChromiumMemoryDumpData from '../GetChromiumMemoryDumpData/GetChromiumMemoryDumpData.ts'

export const name = 'chromium-memory-dump-processes'

export const getData = GetChromiumMemoryDumpData.getChromiumMemoryDumpProcessData

export const createChart = () => ({
  subtitle: 'Private footprint before and after the scenario. Labels include signed change and peak RSS.',
  title: 'Chromium process memory',
  type: 'memory-comparison-chart',
  width: 1400,
})

export const multiple = true
