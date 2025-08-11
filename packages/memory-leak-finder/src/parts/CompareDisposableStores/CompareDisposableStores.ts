import * as GetDisposableStoresWithStackTraces from '../GetDisposableStoresWithStackTraces/GetDisposableStoresWithStackTraces.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as StartTrackingDisposableStores from '../StartTrackingDisposableStores/StartTrackingDisposableStores.js'
import * as StopTrackingDisposableStores from '../StopTrackingDisposableStores/StopTrackingDisposableStores.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

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
