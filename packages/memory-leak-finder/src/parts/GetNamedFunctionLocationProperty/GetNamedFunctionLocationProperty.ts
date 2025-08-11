import * as EmptyFunctionLocation from '../EmptyFunctionLocation/EmptyFunctionLocation.js'
import * as GetBoundFunctionValue from '../GetBoundFunctionValue/GetBoundFunctionValue.js'
import * as IsFunctionLocation from '../IsFunctionLocation/IsFunctionLocation.js'

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
