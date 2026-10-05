import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'
import { TrackedAllocationsChartLimit } from '../TrackedAllocationsChartLimit/TrackedAllocationsChartLimit.ts'

interface TrackedAllocationPerformanceFile {
  readonly collectedCount?: number
  readonly createdCount?: number
  readonly retainedCount?: number
  readonly source?: string
  readonly sourceSelfTimeMs?: number
  readonly sourceSelfTimePercent?: number
}

const getFiles = (rawData: any): readonly TrackedAllocationPerformanceFile[] => {
  if (Array.isArray(rawData?.trackedAllocationPerformance?.files)) {
    return rawData.trackedAllocationPerformance.files
  }
  if (Array.isArray(rawData?.files)) {
    return rawData.files
  }
  return []
}

export const getTrackedAllocationPerformanceData = async (basePath: string) => {
  const resultsPath = join(basePath, 'tracked-allocation-performance')
  if (!existsSync(resultsPath)) {
    return []
  }
  const allData = []
  const dirents = (await readdir(resultsPath)).filter((dirent) => dirent.endsWith('.json')).toSorted()
  for (const dirent of dirents) {
    const rawData = await readJson(join(resultsPath, dirent))
    const fileData = getFiles(rawData)
      .map((file) => ({
        collectedCount: file.collectedCount || 0,
        createdCount: file.createdCount || 0,
        name: file.source || 'Unknown',
        retainedCount: file.retainedCount || 0,
        sourceSelfTimeMs: file.sourceSelfTimeMs || 0,
        sourceSelfTimePercent: file.sourceSelfTimePercent || 0,
      }))
      .toSorted(
        (a, b) =>
          b.collectedCount - a.collectedCount ||
          b.createdCount - a.createdCount ||
          b.sourceSelfTimeMs - a.sourceSelfTimeMs ||
          a.name.localeCompare(b.name),
      )
    const limitedData = fileData.slice(0, TrackedAllocationsChartLimit)
    allData.push({
      data: limitedData,
      filename: dirent.replace('.json', ''),
      omittedEntryCount: fileData.length - limitedData.length,
    })
  }
  return allData
}
