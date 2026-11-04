import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { expandStringStackGroups } from '../ExpandStringStackGroups/ExpandStringStackGroups.ts'
import { getGroupKey, getStringPattern, type LocatedString } from '../GetStringGroupKey/GetStringGroupKey.ts'
import { getStackLabels } from '../GetStackLabels/GetStackLabels.ts'
import { readJson } from '../ReadJson/ReadJson.ts'

const excludedStringValues = new Set(['NaN', '0', '4294967040', 'Infinity', '-Infinity', 'BigInt', 'Circular', '[Circular]'])
const excludedStringFragments = ['Renderer reported VERY LONG TASK', 'perf] SLOW task detected']

const isExcludedString = (value: string): boolean =>
  excludedStringValues.has(value) || value.startsWith('[BigInt ') || excludedStringFragments.some((fragment) => value.includes(fragment))

export const getStringsWithLocationsData = async (basePath: string) => {
  const directory = join(basePath, 'strings-with-locations')
  if (!existsSync(directory)) return []
  const result = []
  for (const filename of await readdir(directory)) {
    const raw = await readJson(join(directory, filename))
    const groups: readonly LocatedString[] = raw.stringsWithLocations ?? []
    let omittedEntryCount = 0
    const grouped = new Map<string, { group: LocatedString; count: number; strings: Set<string>; stackStringCount: number }>()
    for (const group of groups.flatMap(expandStringStackGroups)) {
      if (!group.stack && group.string !== null && isExcludedString(group.string)) {
        omittedEntryCount++
        continue
      }
      const key = getGroupKey(group)
      let entry = grouped.get(key)
      if (!entry) {
        entry = { group, count: 0, strings: new Set(), stackStringCount: 0 }
        grouped.set(key, entry)
      }
      entry.count += group.count
      if (group.stack && group.string === group.stack) entry.stackStringCount += group.count
      if (group.string !== null) entry.strings.add(group.string)
    }
    const stackLabels = getStackLabels([...grouped.values()].map((entry) => entry.group))
    const data = [...grouped]
      .map(([comparisonKey, { group, count, strings, stackStringCount }]) => {
        const pattern = group.string === null ? null : getStringPattern(group.string, group.location)
        const text = group.stack
          ? `Stack: ${JSON.stringify(group.stack)}`
          : group.string === null
            ? `[${group.stringType ?? 'unavailable string'} #${group.heapObjectId}]`
            : JSON.stringify(pattern)
        const location = group.location
          ? `${group.locationKind === 'stack-frame' ? 'stack frame: ' : ''}${group.location}`
          : 'unknown location'
        const samples = [...strings].sort()
        const title = [
          `${count} added string objects`,
          location,
          ...(group.stack
            ? [`${stackStringCount} complete stack string objects; ${count - stackStringCount} component string objects`, group.stack]
            : []),
          ...(!group.stack && pattern !== group.string
            ? [
                `${pattern === '<short hash>' ? 'Short hashes' : 'Numeric path segments'} grouped; ${samples.length} distinct string value${samples.length === 1 ? '' : 's'}`,
              ]
            : []),
          ...(group.string === null ? [text] : []),
          ...samples.slice(0, 5).map((value) => JSON.stringify(value)),
          ...(samples.length > 5 ? [`${samples.length - 5} more values in the measurement JSON`] : []),
        ].join('\n')
        return {
          count,
          delta: count,
          name: `${text} (${location})`,
          label: `${stackLabels.get(comparisonKey) ?? text} at ${location}`,
          title,
          comparisonKey,
        }
      })
      .sort((a, b) => b.count - a.count || a.comparisonKey.localeCompare(b.comparisonKey))
    result.push({
      data,
      filename: filename.replace(/\.json$/, ''),
      omittedEntryCount,
      ...(!data.length && omittedEntryCount ? { status: 'Only excluded strings grew; omitted from chart.' } : {}),
    })
  }
  return result
}
