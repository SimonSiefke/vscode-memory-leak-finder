const functionStatistics = Object.create(null)

export const trackFunctionCall = (scriptId, line, column) => {
  const key = `${scriptId}:${line}:${column}`
  functionStatistics[key] ||= 0
  functionStatistics[key]++
}

export const getFunctionStatistics = () => {
  return functionStatistics
}
