import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface HeapSnapshotSample {
  readonly runIndex?: unknown
  readonly metrics?: { readonly heapBytes?: unknown }
}

export const getHeapSnapshotMemoryOverviewData = async (basePath: string) => {
  const resultsPath = join(basePath, 'heapSnapshotBytes')
  if (!existsSync(resultsPath)) return []

  const data: { count: number; index: number; name: string }[] = []
  for (const file of (await readdir(resultsPath)).filter((entry) => entry.endsWith('.json')).sort()) {
    const result = await readJson(join(resultsPath, file))
    const samples: HeapSnapshotSample[] = Array.isArray(result?.heapSnapshotBytes?.samples) ? result.heapSnapshotBytes.samples : []
    const finalSample = samples
      .map((sample, index) => ({
        index,
        runIndex: typeof sample?.runIndex === 'number' && Number.isFinite(sample.runIndex) ? sample.runIndex : index,
        value: sample?.metrics?.heapBytes,
      }))
      .filter((sample) => typeof sample.value === 'number' && Number.isFinite(sample.value))
      .sort((a, b) => a.runIndex - b.runIndex || a.index - b.index)
      .at(-1)

    if (finalSample) {
      data.push({ count: finalSample.value as number, index: data.length, name: file })
    }
  }
  return data
}
