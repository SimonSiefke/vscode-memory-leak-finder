import type { Dynamic } from '../Types/Types.ts'
const compareInstanceCount = (a: Dynamic, b: Dynamic) => {
  return b.count - a.count
}
const compareInstanceName = (a: Dynamic, b: Dynamic) => {
  if (a.name && b.name) {
    return a.name.localeCompare(b.name)
  }
  return 0
}
export const compareInstance = (a: Dynamic, b: Dynamic) => {
  return compareInstanceCount(a, b) || compareInstanceName(a, b)
}
