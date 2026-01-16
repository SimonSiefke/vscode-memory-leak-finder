import { TransformOptions } from '../Types/Types.js'
import { addTrackingPreamble } from '../AddTrackingPreamble/AddTrackingPreamble.js'
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  const transformedCode = transformCodeWithTracking(code, { ...options })
  const final = addTrackingPreamble(transformedCode)
  return final
}
