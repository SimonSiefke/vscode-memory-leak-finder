import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.js'
import { TransformOptions } from '../Types/Types.js'

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const transformedCode = transformCodeWithTracking(code, { ...options })
  return transformedCode
}
