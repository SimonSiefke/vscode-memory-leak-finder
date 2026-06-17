import type { Dynamic } from '../Types/Types.ts'
export const getDomNodeHash = (domNode: Dynamic) => {
  return `${domNode.className}-${domNode.description}`
}
