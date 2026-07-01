import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface CpuPerformanceCounterRow {
  readonly available?: boolean
  readonly name?: string
  readonly value?: number | null
}

const toChartRow = (row: CpuPerformanceCounterRow) => {
  return {
    name: row.name || '',
    value: row.value || 0,
  }
}

export const getCpuPerformanceCountersData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'cpu-performance-counters')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    const metrics = rawData.cpuPerformanceCounters?.metrics || []
    const data = metrics
      .filter((row: CpuPerformanceCounterRow) => row.available && typeof row.value === 'number')
      .map(toChartRow)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
