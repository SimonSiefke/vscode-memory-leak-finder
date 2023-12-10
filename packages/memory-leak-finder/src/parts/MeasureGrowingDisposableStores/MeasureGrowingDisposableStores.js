import * as Arrays from '../Arrays/Arrays.js'
import * as GetDisposableStoreSizes from '../GetDisposableStoreSizes/GetDisposableStoreSizes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

// TODO
// 1. find the DisposableStore constructor
// 2. Modify the disposableStore add function to track the stacktrace of the calling function and store it as an array of strings on the disposableStore instance
// 3. query all objects
// 4. filter all objects to find all disposableStore instances
// 5. store all disposableStoreInstances in a weak map: <ref> -> <size>
// 6. run the test
// 7. query all disposableStore instances again
// 8. check which disposableStores have increase in size using the weak map
// 9. return the leaked disposable store size and stack traces

export const id = MeasureId.GrowingDisposableStores

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDisposableStoreSizes.getDisposableStoreSizes(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetDisposableStoreSizes.getDisposableStoreSizes(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

const getTotal = (disposableStoreSizes) => {
  return Arrays.sum(disposableStoreSizes)
}

export const isLeak = ({ before, after }) => {
  return getTotal(after) > getTotal(before)
}
