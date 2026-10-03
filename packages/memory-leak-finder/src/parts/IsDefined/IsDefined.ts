import type { Dynamic } from '../Types/Types.ts'
export const isDefined = (value: Dynamic) => {
  return value !== ''
}
