import * as IsBoundFunctionProperty from '../IsBoundFunctionProperty/IsBoundFunctionProperty.js'

export const getBoundFunctionValue = (fnResult) => {
  return fnResult.internalProperties.find(IsBoundFunctionProperty.isBoundFunctionProperty)
}
