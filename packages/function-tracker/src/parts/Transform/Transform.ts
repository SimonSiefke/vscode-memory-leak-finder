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

  globalThis.resetAllocationStatistics = () => {
    allocationStatistics = Object.create(null)
  }
})();
`

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const { trackingMode = 'functions' } = options
  if (trackingMode === 'allocations') {
    const transformedCode = transformCodeWithAllocationTracking(code, { ...options })
    return ALLOCATION_PREAMBLE_CODE + '\n' + transformedCode
  }
  const transformedCode = transformCodeWithTracking(code, { ...options })
  return PREAMBLE_CODE + '\n' + transformedCode
}
