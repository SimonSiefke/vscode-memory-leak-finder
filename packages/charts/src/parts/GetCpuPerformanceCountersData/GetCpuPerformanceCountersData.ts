import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface CpuPerformanceCounterRow {
  readonly available?: boolean
  readonly name?: string
  readonly value?: number | null
}

export interface CpuPerformanceCountersChart {
  readonly data: { name: string; value: number }[]
  readonly filename: string
  readonly status?: string
}

const toChartRow = (row: CpuPerformanceCounterRow) => {
  return {
    name: row.name || '',
    value: row.value as number,
  }
}

export const getCpuPerformanceCountersData = async (basePath: string): Promise<CpuPerformanceCountersChart[]> => {
  const resultsPath = join(basePath, 'cpu-performance-counters')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath, { recursive: true })
  const allData: CpuPerformanceCountersChart[] = []
  for (const dirent of dirents.filter((file) => file.endsWith('.json')).toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    if (!rawData.cpuPerformanceCounters) continue
    const metrics: CpuPerformanceCounterRow[] = rawData.cpuPerformanceCounters.metrics || []
    const data = metrics
      .filter((row) => row.available && typeof row.value === 'number' && Number.isFinite(row.value) && row.value >= 0)
      .map(toChartRow)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
    allData.push({
      data,
      filename: dirent.slice(0, -5).replaceAll('\\', '/'),
      ...(data.length ? {} : { status: 'CPU performance counters unavailable' }),
    })
  }
  return allData
}
