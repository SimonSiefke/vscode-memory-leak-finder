import type { ScriptMap } from '../Types/Types.ts'
import { resolveTrackedLocationSourceMaps } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'

interface StringLocationGroup {
  readonly string: string | null
  readonly sourceLocation: string | null
  readonly count: number
  readonly stackCounts?: readonly { readonly stack: string; readonly count: number }[]
  readonly locationKind?: 'stack-frame'
  readonly heapObjectId?: string
  readonly stringType?: string
}

interface LocatedString extends StringLocationGroup {
  readonly location: string | null
  readonly originalLocation?: string
}

export interface LeakedStringWithLocation extends LocatedString {
  readonly beforeCount: number
  readonly afterCount: number
}

const resolveGroups = async (groups: readonly StringLocationGroup[], scriptMap: ScriptMap): Promise<readonly LocatedString[]> => {
  const keys = [
    ...new Set(
      groups.flatMap((group) => {
        if (!group.sourceLocation) return []
        const scriptId = group.sourceLocation.match(/^(\d+):\d+:\d+$/)?.[1]
        // Do not let the shared resolver's workbench fallback map an unknown script.
        if (scriptId && !scriptMap[scriptId]) return []
        return [group.sourceLocation]
      }),
    ),
  ]
  let resolved: Awaited<ReturnType<typeof resolveTrackedLocationSourceMaps>> = {}
  if (keys.length) {
    try {
      resolved = await resolveTrackedLocationSourceMaps(keys, scriptMap)
    } catch {
      // Generated retaining locations remain useful if source maps cannot load.
    }
  }
  return groups.map((group) => {
    const position = group.sourceLocation ? resolved[group.sourceLocation] : undefined
    const originalLocation =
      position?.originalSource && position.originalLine !== null && position.originalColumn !== null
        ? `${position.originalSource}:${position.originalLine}:${position.originalColumn + 1}`
        : undefined
    return { ...group, location: originalLocation || group.sourceLocation, ...(originalLocation ? { originalLocation } : {}) }
  })
}

const groupKey = (group: LocatedString) =>
  JSON.stringify([group.string, group.location, group.heapObjectId ?? null, group.locationKind ?? null])

const aggregate = (groups: readonly LocatedString[]) => {
  const result = new Map<string, LocatedString>()
  const partitions = new Map<string, Map<string, number>>()
  for (const group of groups) {
    const key = groupKey(group)
    const previous = result.get(key)
    const representative = previous && (previous.sourceLocation ?? '') < (group.sourceLocation ?? '') ? previous : group
    for (const entry of group.stackCounts ?? []) {
      let counts = partitions.get(key)
      if (!counts) {
        counts = new Map()
        partitions.set(key, counts)
      }
      counts.set(entry.stack, (counts.get(entry.stack) ?? 0) + entry.count)
    }
    result.set(key, { ...representative, count: (previous?.count ?? 0) + group.count })
  }
  for (const [key, counts] of partitions) {
    const group = result.get(key)!
    result.set(key, {
      ...group,
      stackCounts: [...counts].map(([stack, count]) => ({ stack, count })).sort((a, b) => a.stack.localeCompare(b.stack)),
    })
  }
  return result
}

export const resolveStringsWithLocations = async (
  before: readonly StringLocationGroup[],
  after: readonly StringLocationGroup[],
  beforeScripts: ScriptMap,
  afterScripts: ScriptMap,
): Promise<readonly LeakedStringWithLocation[]> => {
  const beforeGroups = aggregate(await resolveGroups(before, beforeScripts))
  const afterGroups = aggregate(await resolveGroups(after, afterScripts))
  const result: LeakedStringWithLocation[] = []
  for (const [key, group] of afterGroups) {
    const beforeCount = beforeGroups.get(key)?.count ?? 0
    const count = group.count - beforeCount
    if (count <= 0) continue
    const previousStacks = new Map(beforeGroups.get(key)?.stackCounts?.map(({ stack, count }) => [stack, count]))
    const growingStacks = (group.stackCounts ?? [])
      .map(({ stack, count }) => ({ stack, count: count - (previousStacks.get(stack) ?? 0) }))
      .filter(({ count }) => count > 0)
    // If ownership moved between stacks while some variants shrank, the net
    // count cannot be partitioned faithfully. Keep that row uncollapsed.
    const attributedCount = growingStacks.reduce((sum, entry) => sum + entry.count, 0)
    const { stackCounts: _stackCounts, ...metadata } = group
    result.push({
      ...metadata,
      count,
      beforeCount,
      afterCount: group.count,
      ...(growingStacks.length && attributedCount <= count ? { stackCounts: growingStacks } : {}),
    })
  }
  return result.sort((a, b) => b.count - a.count || groupKey(a).localeCompare(groupKey(b)))
}
