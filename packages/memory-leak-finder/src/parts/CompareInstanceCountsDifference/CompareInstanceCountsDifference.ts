import type { Dynamic } from '../Types/Types.ts'
import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

const getCountsByName = (instances: readonly { readonly name: string; readonly count: number }[]): Map<string, number> => {
  const counts = new Map<string, number>()
  for (const instance of instances) {
    counts.set(instance.name, (counts.get(instance.name) ?? 0) + instance.count)
  }
  return counts
}

export const compareInstanceCountsDifference = async (before: Dynamic, after: Dynamic) => {
  const beforeMap = getCountsByName(before)
  const afterMap = getCountsByName(after)
  const leaked: Dynamic[] = []
  for (const [name, afterCount] of afterMap) {
    const beforeCount = beforeMap.get(name) ?? 0
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        name,
        count: afterCount,
        delta,
      })
    }
  }
  const prettyLeaked = await PrettifyInstanceCounts.prettifyInstanceCounts(leaked)
  return prettyLeaked
}
