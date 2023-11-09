export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'weak-map-count':
      return MemoryLeakFinder.Measures.MeasureWeakMapCount
    case 'event-target-count':
      return MemoryLeakFinder.Measures.MeasureEventTargetCount
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    case 'event-listeners-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureEventListenersWithStackTraces
    case 'function-count':
      return MemoryLeakFinder.Measures.MeasureFunctionCount
    case 'detached-dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeCount
    case 'set-timeout':
      return MemoryLeakFinder.Measures.MeasureSetTimeout
    case 'promise-count':
      return MemoryLeakFinder.Measures.MeasurePromiseCount
    case 'resize-observer-count':
      return MemoryLeakFinder.Measures.MeasureResizeObserverCount
    case 'intersection-observer-count':
      return MemoryLeakFinder.Measures.MeasureIntersectionObserverCount
    case 'set-size':
      return MemoryLeakFinder.Measures.MeasureSetSize
    case 'detached-dom-nodes':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodes
    case 'media-query-list-count':
      return MemoryLeakFinder.Measures.MeasureMediaQueryListCount
    case 'array-element-count':
      return MemoryLeakFinder.Measures.MeasureArrayElementCount
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
