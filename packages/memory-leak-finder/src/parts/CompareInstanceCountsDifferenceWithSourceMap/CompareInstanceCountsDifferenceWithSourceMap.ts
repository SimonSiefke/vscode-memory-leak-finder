import * as PrettifyInstanceCountsWithSourceMap from '../PrettifyInstanceCountsWithSourceMap/PrettifyInstanceCountsWithSourceMap.ts'

const getKey = (element: { scriptId: string; lineNumber: number; columnNumber: number }): string => {
  return `${element.scriptId}:${element.lineNumber}:${element.columnNumber}`
}

export const compareInstanceCountsDifferenceWithSourceMap = async (before: unknown, after: unknown) => {
  const beforeMap: { [key: string]: number } = Object.create(null)
  for (const element of before as readonly { scriptId: string; lineNumber: number; columnNumber: number; count: number }[]) {
    const key = getKey(element)
    beforeMap[key] = element.count
  }
  const leaked: { scriptId: string; lineNumber: number; columnNumber: number; count: number; beforeCount: number; [key: string]: unknown }[] = []
  for (const element of after as readonly { scriptId: string; lineNumber: number; columnNumber: number; count: number; [key: string]: unknown }[]) {
    const key = getKey(element)
    const beforeCount = beforeMap[key] || 0
    const afterCount = element.count
    const delta = afterCount - beforeCount
    if (delta > 0) {
      leaked.push({
        ...element,
        beforeCount,
      })
    }
  }
  const prettyLeaked = await PrettifyInstanceCountsWithSourceMap.prettifyInstanceCountsWithSourceMap(leaked)
  return prettyLeaked
}
