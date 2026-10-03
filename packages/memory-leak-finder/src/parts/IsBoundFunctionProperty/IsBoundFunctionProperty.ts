import type { Dynamic } from '../Types/Types.ts'
export const isBoundFunctionProperty = (value: Dynamic) => {
  return value.name === '[[TargetFunction]]'
}
