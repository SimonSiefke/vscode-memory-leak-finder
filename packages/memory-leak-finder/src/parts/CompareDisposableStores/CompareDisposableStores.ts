import * as GetDisposableStoresWithStackTraces from '../GetDisposableStoresWithStackTraces/GetDisposableStoresWithStackTraces.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as StartTrackingDisposableStores from '../StartTrackingDisposableStores/StartTrackingDisposableStores.ts'
import * as StopTrackingDisposableStores from '../StopTrackingDisposableStores/StopTrackingDisposableStores.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

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
