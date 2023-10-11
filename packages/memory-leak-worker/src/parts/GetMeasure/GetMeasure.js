export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
