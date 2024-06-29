import * as CamelCase from '../CamelCase/CamelCase.js'

export const getMeasure = (MemoryLeakFinder, measureId) => {
  const camelCaseId = CamelCase.camelCase(measureId)
  for (const measure of Object.values(MemoryLeakFinder.Measures)) {
    if (measure.id === camelCaseId) {
      return measure
    }
  }
  if (!measureId) {
    return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
  throw new Error(`measure not found ${measureId}`)
}
