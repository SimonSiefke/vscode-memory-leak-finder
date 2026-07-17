import type { TransformOptions } from '../Types/Types.ts'
import { transformCodeWithAllocationTracking } from '../TransformCodeWithAllocationTracking/TransformCodeWithAllocationTracking.ts'
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

const TIMEOUT_PREAMBLE_CODE = `(() => {
  if(globalThis.getTrackedTimeoutCount){
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
