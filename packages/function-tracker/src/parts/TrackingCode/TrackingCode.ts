export const trackingCode: string = `
globalThis.___functionStatistics = Object.create(null)

const trackFunctionCall = (scriptId, line, column) => {
  const key = \`\${scriptId}:\${line}:\${column})\`
  const current = globalThis.___functionStatistics[key] || 0
  globalThis.___functionStatistics[key]++
}
`
