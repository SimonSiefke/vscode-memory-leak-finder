import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface HeapSnapshotSample {
  readonly runIndex?: number
  readonly metrics?: { readonly heapBytes?: number }
}

export const getHeapSnapshotMemoryData = async (basePath: string): Promise<any[]> => {
  const resultsPath = join(basePath, 'heapSnapshotBytes')
  if (!existsSync(resultsPath)) return []
  const charts: any[] = []
  for (const file of (await readdir(resultsPath)).filter((entry) => entry.endsWith('.json')).sort()) {
    const result = await readJson(join(resultsPath, file))
    const samples: HeapSnapshotSample[] = result.heapSnapshotBytes?.samples || []
    const data = samples
      .filter((sample) => typeof sample.metrics?.heapBytes === 'number' && Number.isFinite(sample.metrics.heapBytes))
      .map((sample, index) => ({
        runIndex: typeof sample.runIndex === 'number' ? sample.runIndex : index,
        value: sample.metrics!.heapBytes!,
      }))
      .sort((a, b) => a.runIndex - b.runIndex)
    if (data.length > 0) charts.push({ data, filename: file.replace(/\.json$/, '') })
  }
  return charts
}
