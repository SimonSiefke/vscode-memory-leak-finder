type DisposableStore = {
  readonly length: number
  readonly [index: number]: { readonly stackTrace: string }
  readonly some: (predicate: (item: { readonly stackTrace: string }) => boolean) => boolean
}

const hasStackTrace = (stackTrace: string): boolean => {
  return stackTrace !== ''
}

const hasItems = (disposableStore) => {
  return disposableStore.length && disposableStore.some(hasStackTrace)
}

const compareSize = (a, b) => {
  return b.length - a.length
}

const prettifyDisposableStores = (disposableStores) => {
  const viableStores = disposableStores.filter(hasItems)
  const sortedStores = viableStores.sort(compareSize)
  return sortedStores
}

export const compareDisposableStores = (before: readonly DisposableStore[], after: readonly DisposableStore[]): { after: readonly DisposableStore[]; before: readonly DisposableStore[] } => {
  const prettyBefore = prettifyDisposableStores(before)
  const prettyAfter = prettifyDisposableStores(after)
  return {
    after: prettyAfter,
    before: prettyBefore,
  }
}
