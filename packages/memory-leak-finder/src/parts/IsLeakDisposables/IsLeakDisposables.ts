import type { Dynamic } from '../Types/Types.ts'
const hasGreaterCount = (item: Dynamic) => {
  return item.count > item.oldCount || item.delta > 0
}
export const isLeakDisposables = (newItems: Dynamic) => {
  return newItems.some(hasGreaterCount)
}
