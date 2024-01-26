const isBoundFunctionProperty = (value) => {
  return value.name === '[[TargetFunction]]'
}

export const getBoundFunctionValue = (fnResult) => {
  return fnResult.internalProperties.find(isBoundFunctionProperty)
}
