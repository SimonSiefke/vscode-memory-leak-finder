import type { Dynamic } from '../Types/Types.ts'
export const getFunctionUrl = (functionLocation: Dynamic, scriptMap: Dynamic) => {
  const match = scriptMap[functionLocation.scriptId]
  if (!match) {
    return ''
  }
  return match.url
}
