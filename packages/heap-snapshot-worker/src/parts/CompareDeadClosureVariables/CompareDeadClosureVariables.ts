import { readFile } from 'node:fs/promises'
import { addOriginalSources, type ScriptInfo } from '../AddOriginalSources/AddOriginalSources.ts'
import { getDeadClosureVariables } from '../GetDeadClosureVariables/GetDeadClosureVariables.ts'

const analyze = async (path: string) => {
  const report = getDeadClosureVariables(JSON.parse(await readFile(path, 'utf8')), { groupClosures: true })
  return { deadBytes: report.deadBytes, groups: report.closureGroups }
}

export const compareDeadClosureVariables = async (
  beforePath: string,
  afterPath: string,
  scriptMap: Readonly<Record<number, ScriptInfo>> = {},
) => {
  // Retain only aggregate bytes and function groups between the two heap analyses.
  const before = await analyze(beforePath)
  const after = await analyze(afterPath)
  const beforeGroups = new Map(before.groups.map((group) => [group.functionKey, group]))
  const growing = after.groups
    .flatMap((group) => {
      const previous = beforeGroups.get(group.functionKey)
      const beforeDeadBytes = previous?.deadBytes ?? 0
      const delta = group.deadBytes - beforeDeadBytes
      if (delta <= 0) return []
      const { functionKey: _key, sourceLocation, ...fields } = group
      return [{ ...fields, beforeCount: previous?.count ?? 0, beforeDeadBytes, delta, ...(sourceLocation ? { sourceLocation } : {}) }]
    })
    .sort((a, b) => b.delta - a.delta || b.deadBytes - a.deadBytes || a.name.localeCompare(b.name))
  // Explicit per-run scripts prevent stale script IDs from unrelated runs being used.
  const scripts: Record<number, ScriptInfo> = { ...scriptMap }
  for (const item of growing) {
    if (!scripts[item.scriptId] && item.url) scripts[item.scriptId] = { url: item.url }
  }
  const mappable = growing.filter((item) => item.scriptId >= 0 && item.line >= 0 && item.column >= 0)
  const enriched = await addOriginalSources(mappable, scripts)
  const originals = new Map(mappable.map((item, index) => [item, enriched[index]]))
  return {
    before: before.deadBytes,
    after: after.deadBytes,
    delta: after.deadBytes - before.deadBytes,
    beforeDetails: { deadBytes: before.deadBytes },
    afterDetails: { deadBytes: after.deadBytes },
    closures: growing.map((item) => ({ ...item, ...originals.get(item) })),
  }
}
