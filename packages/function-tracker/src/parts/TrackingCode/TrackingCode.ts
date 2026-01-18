// Function call tracking infrastructure
export const trackingCode: string = `
// Function call tracking system
if (!globalThis.___functionStatistics) {
  globalThis.___functionStatistics = new Map()
}

const trackFunctionCall = (functionName, scriptId, line, column) => {
  // Always include location info if we have valid line/column, even if scriptId is 0 or falsy
  // scriptId can be 0, which is a valid script ID, so we check for line/column instead
  const hasLocation = line != null && line >= 0 && column != null && column >= 0
  const key = functionName + (hasLocation ? \` (\${scriptId}:\${line}:\${column})\` : '')
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
