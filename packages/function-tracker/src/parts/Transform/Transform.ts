import type { TransformOptions } from '../Types/Types.ts'
import { transformCodeWithAllocationTracking } from '../TransformCodeWithAllocationTracking/TransformCodeWithAllocationTracking.ts'
import { transformCodeWithEverythingTracking } from '../TransformCodeWithEverythingTracking/TransformCodeWithEverythingTracking.ts'
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.ts'

const PREAMBLE_CODE = `(() => {
  if(globalThis.trackFunctionCall){
    return
  }
  const functionStatistics = Object.create(null)

  const trackFunctionCall = (scriptId, line, column) => {
    const key = \`\${scriptId}:\${line}:\${column}\`
    functionStatistics[key] ||= 0
    functionStatistics[key]++
  }



  globalThis.trackFunctionCall = trackFunctionCall

  globalThis.getFunctionStatistics = () => {
    return functionStatistics
  }
})();
`

const ALLOCATION_PREAMBLE_CODE = `(() => {
  if(globalThis.trackAllocation){
    return
  }
  let allocationStatistics = Object.create(null)
  let allocationRuns = []
  let previousRunCreatedCounts = Object.create(null)

  const trackAllocation = (value, scriptId, line, column, type) => {
    if(value === null || (typeof value !== 'object' && typeof value !== 'function')){
      return value
    }
    if(typeof WeakRef === 'undefined'){
      return value
    }
    const location = \`\${scriptId}:\${line}:\${column}\`
    const key = \`\${location}:\${type}\`
    const entry = allocationStatistics[key] ||= {
      aliveCount: 0,
      collectedCount: 0,
      createdCount: 0,
      location,
      refs: [],
      type,
    }
    entry.createdCount++
    entry.refs.push(new WeakRef(value))
    return value
  }

  globalThis.trackAllocation = trackAllocation

  globalThis.getAllocationStatistics = () => {
    const result = Object.create(null)
    for (const [key, entry] of Object.entries(allocationStatistics)) {
      let aliveCount = 0
      for (const ref of entry.refs) {
        if(ref.deref() !== undefined){
          aliveCount++
        }
      }
      const collectedCount = entry.createdCount - aliveCount
      entry.aliveCount = aliveCount
      entry.collectedCount = collectedCount
      result[key] = {
        aliveCount,
        collectedCount,
        createdCount: entry.createdCount,
        location: entry.location,
        type: entry.type,
      }
    }
    return result
  }

  globalThis.markAllocationRun = () => {
    const allocations = []
    for (const [key, entry] of Object.entries(allocationStatistics)) {
      const previousCreatedCount = previousRunCreatedCounts[key] || 0
      const createdCount = entry.createdCount - previousCreatedCount
      previousRunCreatedCounts[key] = entry.createdCount
      if(createdCount === 0){
        continue
      }
      allocations.push({
        createdCount,
        location: entry.location,
        type: entry.type,
      })
    }
    allocationRuns.push({
      allocations,
      runIndex: allocationRuns.length,
    })
  }

  globalThis.getAllocationRuns = () => {
    return allocationRuns
  }

  globalThis.resetAllocationStatistics = () => {
    allocationStatistics = Object.create(null)
    allocationRuns = []
    previousRunCreatedCounts = Object.create(null)
  }
})();
`

const EVERYTHING_PREAMBLE_CODE = `(() => {
  if(typeof globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingMetadata === 'function'){
    return
  }

  const CHUNK_SIZE = 65536
  const TIME_MARK_INTERVAL = 1024
  const chunks = []
  let currentChunk = new Uint32Array(CHUNK_SIZE)
  let currentChunkLength = 0
  let eventCount = 0
  const sites = []
  const siteIds = Object.create(null)
  const seenIdentities = new WeakSet()
  const seenSymbols = new Set()
  const timeMarks = []
  const now = () => typeof performance === 'object' && typeof performance.now === 'function' ? performance.now() : Date.now()
  const startedAt = now()

  const getType = (value, hint) => {
    if(hint !== 'Dynamic'){
      return hint
    }
    if(value === null){
      return 'Null'
    }
    const valueType = typeof value
    if(valueType === 'object'){
      return Array.isArray(value) ? 'Array' : 'Object'
    }
    return valueType[0].toUpperCase() + valueType.slice(1)
  }

  const markTime = (force = false) => {
    if(!force && eventCount !== 0 && eventCount % TIME_MARK_INTERVAL !== 0){
      return
    }
    const elapsedMs = now() - startedAt
    const previous = timeMarks[timeMarks.length - 1]
    if(previous && previous.eventIndex === eventCount){
      previous.elapsedMs = elapsedMs
      return
    }
    timeMarks.push({ eventIndex: eventCount, elapsedMs })
  }

  const appendEvent = (siteId) => {
    markTime()
    if(currentChunkLength === CHUNK_SIZE){
      chunks.push(currentChunk)
      currentChunk = new Uint32Array(CHUNK_SIZE)
      currentChunkLength = 0
    }
    currentChunk[currentChunkLength++] = siteId
    eventCount++
  }

  const recordSite = (scriptId, line, column, type) => {
    const location = \`\${scriptId}:\${line}:\${column}\`
    const key = \`\${location}:\${type}\`
    let siteId = siteIds[key]
    if(siteId === undefined){
      siteId = sites.length
      siteIds[key] = siteId
      sites.push({ id: siteId, location, type })
    }
    appendEvent(siteId)
  }

  const trackEverything = (value, scriptId, line, column, hint, identityMode, methodLocations) => {
    const valueType = typeof value
    if(value !== null && (valueType === 'object' || valueType === 'function')){
      if(identityMode === 'observed' && seenIdentities.has(value)){
        return value
      }
      seenIdentities.add(value)
    } else if(valueType === 'symbol'){
      if(identityMode === 'observed' && seenSymbols.has(value)){
        return value
      }
      seenSymbols.add(value)
    }
    recordSite(scriptId, line, column, getType(value, hint))
    for(const methodLocation of methodLocations){
      recordSite(scriptId, methodLocation[0], methodLocation[1], 'Function')
    }
    return value
  }

  globalThis.__vscodeMemoryLeakFinderTrackEverything = trackEverything
  globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingMetadata = () => {
    markTime(true)
    return {
      chunkCount: chunks.length + (currentChunkLength > 0 ? 1 : 0),
      durationMs: now() - startedAt,
      eventCount,
      sites,
      timeMarks,
    }
  }
  globalThis.__vscodeMemoryLeakFinderGetTrackedEverythingChunk = (index) => {
    if(index < chunks.length){
      return Array.from(chunks[index])
    }
    if(index === chunks.length && currentChunkLength > 0){
      return Array.from(currentChunk.subarray(0, currentChunkLength))
    }
    return []
  }
})();
`

const TIMEOUT_PREAMBLE_CODE = `(() => {
  if(typeof globalThis.getTrackedTimeoutCount === 'function'){
    return
  }

  const activeTimeouts = new Set()
  const originalSetTimeout = globalThis.setTimeout.bind(globalThis)
  const originalClearTimeout = globalThis.clearTimeout.bind(globalThis)
  const originalClearInterval = globalThis.clearInterval.bind(globalThis)

  globalThis.setTimeout = function(callback, timeout, ...args) {
    let id
    const wrappedCallback = typeof callback === 'function'
      ? function(...callbackArgs) {
          activeTimeouts.delete(id)
          return Reflect.apply(callback, this, callbackArgs)
        }
      : callback
    id = originalSetTimeout(wrappedCallback, timeout, ...args)
    activeTimeouts.add(id)
    return id
  }

  globalThis.clearTimeout = function(id) {
    activeTimeouts.delete(id)
    return originalClearTimeout(id)
  }

  globalThis.clearInterval = function(id) {
    activeTimeouts.delete(id)
    return originalClearInterval(id)
  }

  globalThis.getTrackedTimeoutCount = () => {
    return activeTimeouts.size
  }
})();
`

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const { trackingMode = 'functions' } = options
  if (trackingMode === 'everything') {
    const transformedCode = transformCodeWithEverythingTracking(code, { ...options })
    return EVERYTHING_PREAMBLE_CODE + '\n' + transformedCode
  }
  if (trackingMode === 'allocations') {
    const transformedCode = transformCodeWithAllocationTracking(code, { ...options })
    return ALLOCATION_PREAMBLE_CODE + '\n' + transformedCode
  }
  if (trackingMode === 'timeouts') {
    return TIMEOUT_PREAMBLE_CODE + '\n' + code
  }
  const transformedCode = transformCodeWithTracking(code, { ...options })
  return PREAMBLE_CODE + '\n' + transformedCode
}
