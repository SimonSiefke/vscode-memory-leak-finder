export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    case 'detached-dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeCount
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
