export interface FunctionObject {
  readonly url: string
  readonly lineIndex: number
  readonly columnIndex: number
  readonly name: string
  readonly sourceMapUrl: string | null
}

export interface NormalizedFunction {
  readonly url: string
  readonly name: string
  readonly sourceMapUrl: string | null
}

export const normalizeFunctionObjects = (functionObjects: readonly FunctionObject[]): NormalizedFunction[] => {
  const normalized: NormalizedFunction[] = []
  for (const functionObject of functionObjects) {
    const { url, lineIndex, columnIndex, name, sourceMapUrl } = functionObject
    const displayUrl = `${url}:${lineIndex}:${columnIndex}`
    normalized.push({
      url: displayUrl,
      name,
      sourceMapUrl,
    })
  }
  return normalized
}
