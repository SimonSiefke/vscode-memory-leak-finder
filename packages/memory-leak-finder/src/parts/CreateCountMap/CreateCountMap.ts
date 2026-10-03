import type { Dynamic } from '../Types/Types.ts'
export const createCountMap = (array: Dynamic, key: Dynamic) => {
  const map = Object.create(null)
  for (const element of array) {
    map[element[key]] = element.count
  }
  return map
}
