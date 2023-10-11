export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    case 'detached-dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeCount
    case 'set-timeout':
      return MemoryLeakFinder.Measures.SetTimeout
    case 'promise-count':
      return MemoryLeakFinder.Measures.PromiseCount
    case 'resize-observer-count':
      return MemoryLeakFinder.Measures.ResizeObserverCount
    case 'intersection-observer-count':
      return MemoryLeakFinder.Measures.IntersectionOberserverCount
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
