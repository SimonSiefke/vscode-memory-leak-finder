import * as CreateCountMap from '../CreateCountMap/CreateCountMap.ts'
import * as PrettifyInstanceCounts from '../PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

export const compareInstanceCountsDifference = async (before: unknown, after: unknown) => {
  const beforeMap = CreateCountMap.createCountMap(before as readonly { name: string }[], 'name')
  const leaked: { count: number; name: string; [key: string]: unknown }[] = []
  for (const element of after as readonly { count: number; name: string; [key: string]: unknown }[]) {
    const beforeCount = beforeMap[element.name] || 0
    const afterCount = element.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        ...element,
        delta,
      })
    }
  }
  const prettyLeaked = await PrettifyInstanceCounts.prettifyInstanceCounts(leaked)
  return prettyLeaked
}
