export const functionCounterSnippet = `(() => {
  const functionStatistics = Object.create(null)
  
  if (!globalThis.test) {
    globalThis.test = {}
  }
  
  globalThis.test.trackFunctionCall = (scriptId, line, column) => {
    const key = \`\${scriptId}:\${line}:\${column})\`
    functionStatistics[key] ||= 0
    functionStatistics[key]++
  }
  
  globalThis.test.getFunctionStatistics = () => {
    return functionStatistics
  }
})()`
