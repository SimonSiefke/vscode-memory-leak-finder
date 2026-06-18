import type { Dynamic } from '../Types/Types.ts'
export const isFunctionLocation = (internalProperty: Dynamic) => {
  return internalProperty.name === '[[FunctionLocation]]'
}
