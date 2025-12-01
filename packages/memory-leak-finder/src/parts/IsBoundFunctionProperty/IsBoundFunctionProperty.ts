export const isBoundFunctionProperty = (value) => {
  return value.name === '[[TargetFunction]]'
}
