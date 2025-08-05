import * as CamelCase from '../CamelCase/CamelCase.ts'

interface Measure {
  readonly id: string
  readonly create?: (session: any) => any
}

export const getMeasure = (MemoryLeakFinder: any, measureId: string): Measure => {
  const camelCaseId = CamelCase.camelCase(measureId)
  for (const measure of Object.values(MemoryLeakFinder.Measures) as Measure[]) {
    if (measure.id === camelCaseId) {
      return measure
    }
  }
  if (!measureId) {
    return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
  throw new Error(`measure not found ${measureId}`)
}
