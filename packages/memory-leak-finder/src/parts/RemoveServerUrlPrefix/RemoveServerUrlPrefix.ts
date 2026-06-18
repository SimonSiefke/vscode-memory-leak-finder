import type { Dynamic } from '../Types/Types.ts'
const RE_URL = /http:\/\/localhost:\d+\//g
export const removeServerUrlPrefix = (stackTrace: Dynamic) => {
  return stackTrace.replaceAll(RE_URL, '')
}
