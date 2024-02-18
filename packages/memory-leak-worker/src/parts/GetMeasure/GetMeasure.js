import * as CamelCase from '../CamelCase/CamelCase.js'

export const getMeasure = (MemoryLeakFinder, measureId) => {
  const camelCaseId = CamelCase.camelCase(measureId)
  console.log({ camelCaseId })
  for (const measure of Object.values(MemoryLeakFinder.Measures)) {
    if (measure.id === camelCaseId) {
      return measure
    }
  }
  return MemoryLeakFinder.Measures.MeasureEventListenerCount
}
