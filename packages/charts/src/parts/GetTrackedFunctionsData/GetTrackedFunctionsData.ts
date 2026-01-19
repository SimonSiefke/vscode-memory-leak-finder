import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { readdir } from 'node:fs/promises'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getTrackedFunctionsData = async (basePath: string) => {
  const resultsPath = join(basePath, 'tracked-functions')
  if (!existsSync(resultsPath)) {
    return []
  }
  const allData: any[] = []
  try {
    const dirents = await readdir(resultsPath)
    for (const dirent of dirents) {
      if (!dirent.endsWith('.json')) {
        continue
      }
      const filePath = join(resultsPath, dirent)
      const rawData = await readJson(filePath)
      const trackedFunctions = Array.isArray(rawData) ? rawData : rawData.trackedFunctions || []
      const fileData: any[] = []
      const nameCounts = new Map<string, number>()
      for (const item of trackedFunctions) {
        const displayName = item.originalName || item.functionName || 'Unknown'
        const count = item.totalCount || item.callCount || 0
        const delta = item.delta || 0

        // Ensure unique labels by appending numbers to duplicates
        const currentCount = nameCounts.get(displayName) || 0
        nameCounts.set(displayName, currentCount + 1)
        const uniqueName = currentCount === 0 ? displayName : `${displayName}${currentCount}`

        fileData.push({
          name: uniqueName,
          count: count,
          delta: delta,
        })
      }
      fileData.sort((a, b) => b.count - a.count)
      // Limit to top 100 functions for readability per file
      const limitedData = fileData.slice(0, 100)
      // Add filename metadata to the data
      const dataWithFilename = {
        data: limitedData,
        filename: dirent.replace('.json', ''),
      }
      allData.push(dataWithFilename)
    }
  } catch (error) {
    console.error('Error reading tracked functions data:', error)
    return []
  }
  return allData
}
