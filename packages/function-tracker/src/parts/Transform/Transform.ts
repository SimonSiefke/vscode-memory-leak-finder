import { TransformOptions } from '../Types/Types.js'
import { addTrackingPreamble } from '../AddTrackingPreamble/AddTrackingPreamble.js'
import { transformCodeWithTracking } from '../TransformCodeWithTracking/TransformCodeWithTracking.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'

export const transformCode = async (code: string, options: TransformOptions = {}): Promise<string> => {
  // First add the tracking preamble, then transform the functions
  const codeWithPreamble = await addTrackingPreamble(code)
  const transformedCode = await transformCodeWithTracking(codeWithPreamble, options)
  return transformedCode
}

export { addTrackingPreamble, transformCodeWithTracking, createFunctionWrapperPlugin }
