import * as Arrays from '../Arrays/Arrays.js'
import * as GetDisposableStoreSizes from '../GetDisposableStoreSizes/GetDisposableStoreSizes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.DisposableStoreSizes

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

const compareSize = (a, b) => {
  return b - a
}

const cleanArray = (sizes) => {
  return Arrays.toSorted(sizes, compareSize)
}

export const compare = (before, after) => {
  return {
    before: cleanArray(before),
    after: cleanArray(after),
  }
}

const getTotal = (disposableStoreSizes) => {
  return Arrays.sum(disposableStoreSizes)
}

export const isLeak = ({ before, after }) => {
  return getTotal(after) > getTotal(before)
}
