const isFunctionName = (value) => {
  return value.name === 'name'
}

export const getFunctionNameProperty = (fnResult) => {
  const match = fnResult.result.find(isFunctionName)
  if (!match) {
    return ''
  }
  return match.value.value
}
