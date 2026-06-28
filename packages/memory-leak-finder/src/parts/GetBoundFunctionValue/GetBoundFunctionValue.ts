import type { Dynamic } from '../Types/Types.ts'
import * as IsBoundFunctionProperty from '../IsBoundFunctionProperty/IsBoundFunctionProperty.ts'
export const getBoundFunctionValue = (fnResult: Dynamic) => {
  return fnResult.internalProperties.find(IsBoundFunctionProperty.isBoundFunctionProperty)
}
