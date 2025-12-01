export const isFunctionLocation = (internalProperty) => {
  return internalProperty.name === '[[FunctionLocation]]'
}
