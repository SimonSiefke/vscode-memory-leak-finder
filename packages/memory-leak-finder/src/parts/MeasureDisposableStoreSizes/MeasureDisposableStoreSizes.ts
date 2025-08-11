import * as Arrays from '../Arrays/Arrays.ts'
import * as GetDisposableStoreSizes from '../GetDisposableStoreSizes/GetDisposableStoreSizes.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.DisposableStoreSizes

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDisposableStoreSizes.getDisposableStoreSizes(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetDisposableStoreSizes.getDisposableStoreSizes(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
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
