import type { Dynamic } from '../Types/Types.ts'
const isFunctionName = (value: Dynamic) => {
  return value.name === 'name'
}
export const getFunctionNameProperty = (fnResult: Dynamic) => {
  const match = fnResult.result.find(isFunctionName)
  if (!match) {
    return ''
  }
  return match.value.value
}
