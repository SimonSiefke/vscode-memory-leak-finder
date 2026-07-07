import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'
import { TrackedAllocationsChartLimit } from '../TrackedAllocationsChartLimit/TrackedAllocationsChartLimit.ts'

const resultFolders = ['tracked-allocations', 'tracked-allocations-from-start']

const getFilename = (folder: string, dirent: string): string => {
  const name = dirent.replace('.json', '')
  if (folder === 'tracked-allocations') {
    return name
  }
  return `${folder}/${name}`
}

export const getTrackedAllocationsData = async (basePath: string) => {
  const allData: any[] = []
  for (const folder of resultFolders) {
    const resultsPath = join(basePath, folder)
    if (!existsSync(resultsPath)) {
      continue
    }
    const dirents = await readdir(resultsPath)
    for (const dirent of dirents) {
      if (!dirent.endsWith('.json')) {
        continue
      }
      const filePath = join(resultsPath, dirent)
      const rawData = await readJson(filePath)
      const trackedAllocations = Array.isArray(rawData) ? rawData : rawData.trackedAllocations || []
      const fileData = trackedAllocations.map((item: any) => {
        const location = item.originalLocation || item.location || 'Unknown'
        return {
          count: item.createdCount || 0,
          delta: item.collectedCount || 0,
          name: `${item.type || 'Object'} ${location}`,
        }
      })
      fileData.sort((a: any, b: any) => b.delta - a.delta || b.count - a.count)
      const limitedData = fileData.slice(0, TrackedAllocationsChartLimit)
      allData.push({
        data: limitedData,
        filename: getFilename(folder, dirent),
        omittedEntryCount: fileData.length - limitedData.length,
      })
    }
  }
  return allData
}
