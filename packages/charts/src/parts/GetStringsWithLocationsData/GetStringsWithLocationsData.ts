import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { getGroupKey, getStringPattern, type LocatedString } from '../GetStringGroupKey/GetStringGroupKey.ts'
import { readJson } from '../ReadJson/ReadJson.ts'

export const getStringsWithLocationsData = async (basePath: string) => {
  const directory = join(basePath, 'strings-with-locations')
  if (!existsSync(directory)) return []
  const result = []
  for (const filename of await readdir(directory)) {
    const raw = await readJson(join(directory, filename))
    const groups: readonly LocatedString[] = raw.stringsWithLocations ?? []
    const grouped = new Map<string, { group: LocatedString; count: number; strings: Set<string> }>()
    for (const group of groups) {
      const key = getGroupKey(group)
      let entry = grouped.get(key)
      if (!entry) {
        entry = { group, count: 0, strings: new Set() }
        grouped.set(key, entry)
      }
      entry.count += group.count
      if (group.string !== null) entry.strings.add(group.string)
    }
    const data = [...grouped]
      .map(([comparisonKey, { group, count, strings }]) => {
        const text =
          group.string === null
            ? `[${group.stringType ?? 'unavailable string'} #${group.heapObjectId}]`
            : JSON.stringify(getStringPattern(group.string))
        const location = group.location
          ? `${group.locationKind === 'stack-frame' ? 'stack frame: ' : ''}${group.location}`
          : 'unknown location'
        const samples = [...strings].sort()
        const title = [
          `${count} added string objects`,
          location,
          ...(group.string !== null && getStringPattern(group.string) !== group.string
            ? [`Numeric path segments grouped; ${samples.length} distinct string value${samples.length === 1 ? '' : 's'}`]
            : []),
          ...(group.string === null ? [text] : []),
          ...samples.slice(0, 5).map((value) => JSON.stringify(value)),
          ...(samples.length > 5 ? [`${samples.length - 5} more values in the measurement JSON`] : []),
        ].join('\n')
        return { count, delta: count, name: `${text} (${location})`, label: `${text}\n${location}`, title, comparisonKey }
      })
      .sort((a, b) => b.count - a.count || a.comparisonKey.localeCompare(b.comparisonKey))
    result.push({ data, filename: filename.replace(/\.json$/, '') })
  }
  return result
}
