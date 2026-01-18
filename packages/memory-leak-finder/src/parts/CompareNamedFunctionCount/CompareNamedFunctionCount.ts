import * as CreateCountMap from '../CreateCountMap/CreateCountMap.ts'
import * as SortNamedFunctions from '../SortNamedFunctions/SortNamedFunctions.ts'

const mergeFunctions = (beforeFunctions: readonly { url: string; count: number; [key: string]: unknown }[], afterFunctions: readonly { url: string; count: number; [key: string]: unknown }[]): readonly { url: string; count: number; delta: number; [key: string]: unknown }[] => {
  const beforeMap = CreateCountMap.createCountMap(beforeFunctions, 'url')
  const leaked: { url: string; count: number; delta: number; [key: string]: unknown }[] = []
  for (const element of afterFunctions) {
    const beforeCount = (beforeMap[element.url] as number) || 0
    const afterCount = element.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        ...element,
        delta,
      })
    }
  }
  return leaked
}

export const compareNamedFunctionCount = (before: unknown, after: unknown): readonly { url: string; count: number; delta: number; [key: string]: unknown }[] => {
  const beforeFunctions = SortNamedFunctions.sortNamedFunctions(before)
  const afterFunctions = SortNamedFunctions.sortNamedFunctions(after)
  const leaked = mergeFunctions(beforeFunctions, afterFunctions)
  return leaked
}
