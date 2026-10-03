import type { Dynamic } from '../Types/Types.ts'
export const formatUrl = (url: Dynamic, lineNumber: Dynamic, columnNumber: Dynamic) => {
  return `${url}:${lineNumber}:${columnNumber}`
}
