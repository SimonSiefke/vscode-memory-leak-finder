const hasStackTrace = (stackTrace) => {
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

export const compareDisposableStores = (before, after) => {
  const prettyBefore = prettifyDisposableStores(before)
  const prettyAfter = prettifyDisposableStores(after)
  return {
    before: prettyBefore,
    after: prettyAfter,
  }
}
