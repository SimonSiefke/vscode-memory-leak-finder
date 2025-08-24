import * as CamelCase from '../CamelCase/CamelCase.ts'

interface Measure {
  readonly id: string
  readonly create?: (session: any, context?: any) => any
}

export const getMeasure = (MemoryLeakFinder: any, measureId: string): any => {
  const camelCaseId = CamelCase.camelCase(measureId)
  for (const measure of Object.values(MemoryLeakFinder.Measures)) {
    // @ts-ignore
    if (measure.id === camelCaseId) {
      // @ts-ignore
      return measure
    }
  }
  if (!measureId) {
    return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
  throw new Error(`measure not found ${measureId}`)
}
