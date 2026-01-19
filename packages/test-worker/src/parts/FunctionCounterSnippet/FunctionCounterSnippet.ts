export const functionCounterSnippet = `(() => {
  const functionStatistics = Object.create(null)
  
  const trackFunctionCall = (scriptId, line, column) => {
    const key = \`\${scriptId}:\${line}:\${column}\`
    functionStatistics[key] ||= 0
    functionStatistics[key]++
  }
  
  if (!globalThis.test) {
    globalThis.test = {}
  }
  
  globalThis.test.getFunctionStatistics = () => {
    return functionStatistics
  }
})()`
