export interface FunctionObject {
  readonly columnIndex: number
  readonly lineIndex: number
  readonly name: string
  readonly sourceMapUrl: string | null
  readonly url: string
}

export interface NormalizedFunction {
  readonly name: string
  readonly sourceMapUrl: string | null
  readonly url: string
}

export const normalizeFunctionObjects = (functionObjects: readonly FunctionObject[]): NormalizedFunction[] => {
  const normalized: NormalizedFunction[] = []
  for (const functionObject of functionObjects) {
    const { columnIndex, lineIndex, name, sourceMapUrl, url } = functionObject
    const displayUrl = `${url}:${lineIndex}:${columnIndex}`
    normalized.push({
      name,
      sourceMapUrl,
      url: displayUrl,
    })
  }
  return normalized
}
