// Function call tracking infrastructure
export const trackingCode: string = `
// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map()
}

const trackFunctionCall = (functionName, location) => {
  const key = functionName + (location ? \` (\${location})\` : '')
  const current = globalThis.___functionStatistics.get(key) || 0
  globalThis.___functionStatistics.set(key, current + 1)
}

const getFunctionStatistics = () => {
  const stats = {}
  for (const [name, count] of globalThis.___functionStatistics) {
    stats[name] = count
  }
  return stats
}

const resetFunctionStatistics = () => {
  globalThis.___functionStatistics.clear()
}

// Export for debugging
globalThis.getFunctionStatistics = getFunctionStatistics
globalThis.resetFunctionStatistics = resetFunctionStatistics
`
