export interface FunctionObject {
  readonly name: string
  readonly sourceMapUrl: string | null
  readonly url: string
}

export interface AggregatedFunction {
  readonly count: number
  readonly name: string
  readonly sourceMapUrl: string | null
  readonly url: string
}

interface StringNumberMap {
  [key: string]: number
}

interface StringBooleanMap {
  [key: string]: boolean
}

export const aggregateFunctionObjects = (functionObjects: readonly FunctionObject[]): AggregatedFunction[] => {
  const map: StringNumberMap = Object.create(null)
  for (const { url } of functionObjects) {
    map[url] ||= 0
    map[url]++
  }
  const seen: StringBooleanMap = Object.create(null)
  const aggregated: AggregatedFunction[] = []
  for (const { name, sourceMapUrl, url } of functionObjects) {
    if (url in seen) {
      continue
    }
    seen[url] = true
    aggregated.push({
      count: map[url],
      name,
      sourceMapUrl,
      url,
    })
  }
  return aggregated
}
