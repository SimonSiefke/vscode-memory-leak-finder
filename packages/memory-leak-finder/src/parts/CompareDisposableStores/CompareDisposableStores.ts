import type { Dynamic } from '../Types/Types.ts'
const hasStackTrace = (stackTrace: Dynamic) => {
  return stackTrace !== ''
}
const hasItems = (disposableStore: Dynamic) => {
  return disposableStore.length && disposableStore.some(hasStackTrace)
}
const compareSize = (a: Dynamic, b: Dynamic) => {
  return b.length - a.length
}
const prettifyDisposableStores = (disposableStores: Dynamic) => {
  const viableStores = disposableStores.filter(hasItems)
  const sortedStores = viableStores.sort(compareSize)
  return sortedStores
}
export const compareDisposableStores = (before: Dynamic, after: Dynamic) => {
  const prettyBefore = prettifyDisposableStores(before)
  const prettyAfter = prettifyDisposableStores(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
