interface FunctionObject {
  url: string
  sourceMapUrl?: string
  name?: string
}

interface AggregatedFunctionObject {
  name?: string
  url: string
  sourceMapUrl?: string
  count: number
}

export const aggregateFunctionObjects = (functionObjects: FunctionObject[]): AggregatedFunctionObject[] => {
  const map: Record<string, number> = Object.create(null)
  for (const { url } of functionObjects) {
    map[url] ||= 0
    map[url]++
  }
  const seen: Record<string, boolean> = Object.create(null)
  const aggregated: AggregatedFunctionObject[] = []
  for (const { url, sourceMapUrl, name } of functionObjects) {
    if (url in seen) {
      continue
    }
    seen[url] = true
    aggregated.push({
      name,
      url,
      sourceMapUrl,
      count: map[url],
    })
  }
  return aggregated
}
