export const functionCounterSnippet = `(() => {
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

  globalThis.test.getFunctionStatistics = () => {
    return functionStatistics
  }
})()`
