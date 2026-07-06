import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface FrontendStartupPerformanceSample {
  readonly loadEventEnd?: number
  readonly runIndex?: number
}

const isChartableSample = (sample: FrontendStartupPerformanceSample): boolean => {
  return typeof sample.loadEventEnd === 'number'
}

const toChartRow = (sample: FrontendStartupPerformanceSample, index: number) => {
  return {
    runIndex: typeof sample.runIndex === 'number' ? sample.runIndex : index,
    value: sample.loadEventEnd || 0,
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
    const samples = rawData.frontendStartupPerformance?.samples || []
    const data = samples
      .filter(isChartableSample)
      .map(toChartRow)
      .sort((a: { runIndex: number }, b: { runIndex: number }) => a.runIndex - b.runIndex)
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
