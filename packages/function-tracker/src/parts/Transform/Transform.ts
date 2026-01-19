<<<<<<< HEAD
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.ts'
import type { TransformOptions } from '../Types/Types.ts'

const PREAMBLE_CODE = `(() => {
  const functionStatistics = Object.create(null)

  if (!globalThis.test) {
    globalThis.test = {}
  }

  globalThis.test.trackFunctionCall = (scriptId, line, column) => {
    const key = \`\${scriptId}:\${line}:\${column}\`
    functionStatistics[key] ||= 0
    functionStatistics[key]++
  }

  globalThis.test.getFunctionStatistics = () => {
    return functionStatistics
  }
})();
`

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const transformedCode = transformCodeWithTracking(code, { ...options })
  return PREAMBLE_CODE + '\n' + transformedCode
=======
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.js'
import { TransformOptions } from '../Types/Types.js'

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const transformedCode = transformCodeWithTracking(code, { ...options })
  return transformedCode
>>>>>>> origin/main
}
