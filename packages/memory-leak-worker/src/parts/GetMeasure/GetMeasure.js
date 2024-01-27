export const getMeasure = (MemoryLeakFinder, measureId) => {
  switch (measureId) {
    case 'dom-timer-count':
      return MemoryLeakFinder.Measures.MeasureDomTimerCount
    case 'array-count':
      return MemoryLeakFinder.Measures.MeasureArrayCount
    case 'array-element-count':
      return MemoryLeakFinder.Measures.MeasureArrayElementCount
    case 'class-count':
      return MemoryLeakFinder.Measures.MeasureClassCount
    case 'dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDomNodeCount
    case 'disposables':
      return MemoryLeakFinder.Measures.MeasureDisposables
    case 'disposable-difference':
      return MemoryLeakFinder.Measures.MeasureDisposableDifference
    case 'disposable-count':
      return MemoryLeakFinder.Measures.MeasureDisposableCount
    case 'disposable-store-sizes':
      return MemoryLeakFinder.Measures.MeasureDisposableStoreSizes
    case 'detached-dom-node-count':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeCount
    case 'detached-dom-nodes':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodes
    case 'detached-dom-node-roots':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodeRoots
    case 'detached-dom-nodes-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodesWithStackTraces
    case 'growing-disposable-stores':
      return MemoryLeakFinder.Measures.MeasureGrowingDisposableStores
    case 'detached-dom-nodes-difference':
      return MemoryLeakFinder.Measures.MeasureDetachedDomNodesDifference
    case 'event-target-count':
      return MemoryLeakFinder.Measures.MeasureEventTargetCount
    case 'event-targets':
      return MemoryLeakFinder.Measures.MeasureEventTargets
    case 'event-target-difference':
      return MemoryLeakFinder.Measures.MeasureEventTargetDifference
    case 'event-listeners':
      return MemoryLeakFinder.Measures.MeasureEventListeners
    case 'event-listeners-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureEventListenersWithStackTraces
    case 'function-count':
      return MemoryLeakFinder.Measures.MeasureFunctionCount
    case 'instance-counts':
      return MemoryLeakFinder.Measures.MeasureInstanceCounts
    case 'instance-counts-with-source-map':
      return MemoryLeakFinder.Measures.MeasureInstanceCountsWithSourceMap
    case 'instance-counts-difference':
      return MemoryLeakFinder.Measures.MeasureInstanceCountsDifference
    case 'instance-counts-difference-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureInstanceCountsDifferenceWithStackTraces
    case 'instance-counts-difference-with-source-map':
      return MemoryLeakFinder.Measures.MeasureInstanceCountsDifferenceWithSourceMap
    case 'intersection-observer-count':
      return MemoryLeakFinder.Measures.MeasureIntersectionObserverCount
    case 'intersection-observers-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureIntersectionObserversWithStackTraces
    case 'map-size':
      return MemoryLeakFinder.Measures.MeasureMapSize
    case 'media-query-list-count':
      return MemoryLeakFinder.Measures.MeasureMediaQueryListCount
    case 'mutation-observer-count':
      return MemoryLeakFinder.Measures.MeasureMutationObserverCount
    case 'mutation-observers-with-stack-traces':
      return MemoryLeakFinder.Measures.MeasureMutationObserversWithStackTraces
    case 'mutation-observers-with-stack-traces-with-source-maps':
      return MemoryLeakFinder.Measures.MeasureMutationObserversWithStackTracesWithSourceMaps
    case 'named-function-count':
      return MemoryLeakFinder.Measures.MeasureNamedFunctionCount
    case 'named-function-difference':
      return MemoryLeakFinder.Measures.MeasureNamedFunctionDifference
    case 'named-function-difference-with-source-map':
      return MemoryLeakFinder.Measures.MeasureNamedFunctionDifferenceWithSourceMap
    case 'object-count':
      return MemoryLeakFinder.Measures.MeasureObjectCount
    case 'promise-count':
      return MemoryLeakFinder.Measures.MeasurePromiseCount
    case 'promises':
      return MemoryLeakFinder.Measures.MeasurePromises
    case 'real-object-count':
      return MemoryLeakFinder.Measures.MeasureRealObjectCount
    case 'regex-count':
      return MemoryLeakFinder.Measures.MeasureRegexCount
    case 'resize-observer-count':
      return MemoryLeakFinder.Measures.MeasureResizeObserverCount
    case 'set-size':
      return MemoryLeakFinder.Measures.MeasureSetSize
    case 'set-timeout':
      return MemoryLeakFinder.Measures.MeasureSetTimeout
    case 'weak-map-count':
      return MemoryLeakFinder.Measures.MeasureWeakMapCount
    case 'weak-set-count':
      return MemoryLeakFinder.Measures.MeasureWeakSetCount
    default:
      return MemoryLeakFinder.Measures.MeasureEventListenerCount
  }
}
