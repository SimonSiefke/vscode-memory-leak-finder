import * as IsBoundFunctionProperty from '../IsBoundFunctionProperty/IsBoundFunctionProperty.ts'

export const getBoundFunctionValue = (fnResult) => {
  return fnResult.internalProperties.find(IsBoundFunctionProperty.isBoundFunctionProperty)
}
