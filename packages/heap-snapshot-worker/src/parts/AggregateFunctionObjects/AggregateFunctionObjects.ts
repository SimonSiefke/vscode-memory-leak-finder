export interface FunctionObject {
  readonly url: string
  readonly sourceMapUrl: string | null
  readonly name: string
}

export interface AggregatedFunction {
  readonly name: string
  readonly url: string
  readonly sourceMapUrl: string | null
  readonly count: number
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
