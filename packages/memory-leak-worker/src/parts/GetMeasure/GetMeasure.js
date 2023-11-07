export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    case 'event-listeners-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureEventListenersWithStackTraces
    case 'detached-dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeCount
    case 'set-timeout':
      return MemoryLeakFinder.Measures.MeasureSetTimeout
    case 'promise-count':
      return MemoryLeakFinder.Measures.MeasurePromiseCount
    case 'resize-observer-count':
      return MemoryLeakFinder.Measures.MeasureResizeObserverCount
    case 'intersection-observer-count':
      return MemoryLeakFinder.Measures.MeasureIntersectionOberserverCount
    case 'detached-dom-nodes':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodes
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
