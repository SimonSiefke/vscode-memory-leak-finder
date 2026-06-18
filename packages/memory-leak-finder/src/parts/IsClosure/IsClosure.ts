import type { Dynamic } from '../Types/Types.ts'
export const isClosure = (scope: Dynamic) => {
  return scope.description.startsWith('Closure (')
}
