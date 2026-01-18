type DisposableStore = {
  readonly length: number
  readonly [index: number]: { readonly stackTrace: string }
  readonly some: (predicate: (item: { readonly stackTrace: string }) => boolean) => boolean
}

const hasStackTrace = (item: { readonly stackTrace: string }): boolean => {
  return item.stackTrace !== ''
}

const hasItems = (disposableStore: DisposableStore): boolean => {
  return disposableStore.length > 0 && disposableStore.some(hasStackTrace)
}

const compareSize = (a: DisposableStore, b: DisposableStore): number => {
  return b.length - a.length
}

const prettifyDisposableStores = (disposableStores: readonly DisposableStore[]): readonly DisposableStore[] => {
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
