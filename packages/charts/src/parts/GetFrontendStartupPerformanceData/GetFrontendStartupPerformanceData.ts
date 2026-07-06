import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface FrontendStartupPerformanceMetric {
  readonly median?: number
  readonly name?: string
}

const toChartRow = (metric: FrontendStartupPerformanceMetric) => {
  return {
    name: metric.name || '',
    value: metric.median || 0,
  }
}

export const getFrontendStartupPerformanceData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'frontend-startup-performance')
  if (!existsSync(resultsPath)) {
    return []
  }
  const dirents = await readdir(resultsPath)
  const allData: any[] = []
  for (const dirent of dirents.toSorted()) {
    const absolutePath = join(resultsPath, dirent)
    const rawData = await readJson(absolutePath)
    const metrics = rawData.frontendStartupPerformance?.metrics || []
    const data = metrics
      .filter((metric: FrontendStartupPerformanceMetric) => typeof metric.median === 'number')
      .map(toChartRow)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
