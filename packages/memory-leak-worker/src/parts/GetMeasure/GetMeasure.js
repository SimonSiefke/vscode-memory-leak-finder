export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'array-element-count':
      return MemoryLeakFinder.Measures.MeasureArrayElementCount
    case 'class-count':
      return MemoryLeakFinder.Measures.ClassCount
    case 'detached-dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeCount
    case 'detached-dom-nodes':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodes
    case 'event-target-count':
      return MemoryLeakFinder.Measures.MeasureEventTargetCount
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    case 'event-listeners-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureEventListenersWithStackTraces
    case 'function-count':
      return MemoryLeakFinder.Measures.MeasureFunctionCount
    case 'intersection-observer-count':
      return MemoryLeakFinder.Measures.MeasureIntersectionObserverCount
    case 'map-size':
      return MemoryLeakFinder.Measures.MapSize
    case 'media-query-list-count':
      return MemoryLeakFinder.Measures.MeasureMediaQueryListCount
    case 'object-count':
      return MemoryLeakFinder.Measures.MeasureObjectCount
    case 'promise-count':
      return MemoryLeakFinder.Measures.MeasurePromiseCount
    case 'real-object-count':
      return MemoryLeakFinder.Measures.MeasureRealObjectCount
    case 'resize-observer-count':
      return MemoryLeakFinder.Measures.MeasureResizeObserverCount
    case 'set-size':
      return MemoryLeakFinder.Measures.MeasureSetSize
    case 'set-timeout':
      return MemoryLeakFinder.Measures.MeasureSetTimeout
    case 'weak-map-count':
      return MemoryLeakFinder.Measures.MeasureWeakMapCount
    case 'weak-set-count':
      return MemoryLeakFinder.Measures.WeakSetCount
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
