import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getArrayBufferBytesData = async (basePath: string) => {
  const resultsPath = join(basePath, 'arrayBufferBytes')
  if (!existsSync(resultsPath)) {
    return []
  }
  const entries = await readdir(resultsPath, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }
    const { arrayBufferBytes } = await readJson(join(resultsPath, entry.name))
    const { before, after } = arrayBufferBytes ?? {}
    for (const [field, unit] of [
      ['bytes', 'bytes'],
      ['backingStoreCount', 'stores'],
    ] as const) {
      if (!Number.isFinite(before?.[field]) || !Number.isFinite(after?.[field])) {
        throw new Error(`Missing finite before/after ${field} in ${entry.name}`)
      }
      results.push({
        data: [
          { name: `Before iterations (${unit})`, value: before[field] },
          { name: `After iterations (${unit})`, value: after[field] },
        ],
        filename: `${entry.name.slice(0, -'.json'.length)}-${unit}`,
      })
    }
  }
  return results
}
