import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.ts'
import type { TransformOptions } from '../Types/Types.ts'

const PREAMBLE_CODE = `(() => {
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
})();
`

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const transformedCode = transformCodeWithTracking(code, { ...options })
  return PREAMBLE_CODE + '\n' + transformedCode
}
