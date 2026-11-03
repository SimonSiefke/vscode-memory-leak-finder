import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

interface LocatedString {
  readonly string: string | null
  readonly location: string | null
  readonly count: number
  readonly heapObjectId?: string
  readonly stringType?: string
}

export const getStringsWithLocationsData = async (basePath: string) => {
  const directory = join(basePath, 'strings-with-locations')
  if (!existsSync(directory)) return []
  const result = []
  for (const filename of await readdir(directory)) {
    const raw = await readJson(join(directory, filename))
    const groups: readonly LocatedString[] = raw.stringsWithLocations ?? []
    const data = groups
      .map((group) => {
        const text =
          group.string === null ? `[${group.stringType ?? 'unavailable string'} #${group.heapObjectId}]` : JSON.stringify(group.string)
        const preview = text.length > 100 ? `${text.slice(0, 100)}…` : text
        return {
          count: group.count,
          delta: group.count,
          name: `${preview} (${group.location ?? 'unknown location'})`,
          comparisonKey: JSON.stringify([group.string, group.location, group.heapObjectId ?? null]),
        }
      })
      .sort((a, b) => b.count - a.count || a.comparisonKey.localeCompare(b.comparisonKey))
    result.push({ data, filename: filename.replace(/\.json$/, '') })
  }
  return result
}
