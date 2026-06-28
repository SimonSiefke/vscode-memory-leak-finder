import type { Dynamic } from '../Types/Types.ts'
export const isEnumerable = (property: Dynamic) => {
  return property.enumerable
}
