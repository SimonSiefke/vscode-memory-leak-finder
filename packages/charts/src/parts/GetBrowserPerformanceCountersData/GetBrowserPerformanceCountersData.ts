import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface BrowserPerformanceCounterRow {
  readonly available?: boolean
  readonly delta?: number | null
  readonly name?: string
}

const toChartRow = (row: BrowserPerformanceCounterRow) => {
  return {
    name: row.name || '',
    value: row.delta || 0,
  }
}

export const getBrowserPerformanceCountersData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'browser-performance-counters')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    const metrics = rawData.browserPerformanceCounters?.metrics || []
    const data = metrics
      .filter((row: BrowserPerformanceCounterRow) => row.available && typeof row.delta === 'number')
      .map(toChartRow)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
