import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.ts'
import * as GetBoundFunctionValue from '../GetBoundFunctionValue/GetBoundFunctionValue.ts'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.ts'

export const getNamedFunctionLocationProperty = (session, fnResult, scriptMap, includeSourceMap, getNamedFunctionLocation) => {
  const functionLocation = fnResult.internalProperties.find(IsFunctionLocation.isFunctionLocation)
  if (!functionLocation) {
    const boundFunctionValue = GetBoundFunctionValue.getBoundFunctionValue(fnResult)
    if (!boundFunctionValue) {
      return EmptyFunctionLocation.emptyFunctionLocation
    }
    const boundFunctionObjectId = boundFunctionValue.value.objectId
    return getNamedFunctionLocation(boundFunctionObjectId, session, scriptMap, includeSourceMap)
  }
  return functionLocation.value.value
}
