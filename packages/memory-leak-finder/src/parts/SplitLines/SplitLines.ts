import type { Dynamic } from '../Types/Types.ts'
export const splitLines = (string: Dynamic) => {
  if (string === '') {
    return []
  }
  return string.split('\n')
}
