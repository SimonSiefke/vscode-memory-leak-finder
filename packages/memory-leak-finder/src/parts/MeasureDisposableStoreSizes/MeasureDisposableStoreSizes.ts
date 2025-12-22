import type { Session } from '../Session/Session.ts'
import * as Arrays from '../Arrays/Arrays.ts'
import * as GetDisposableStoreSizes from '../GetDisposableStoreSizes/GetDisposableStoreSizes.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DisposableStoreSizes

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetDisposableStoreSizes.getDisposableStoreSizes(session, objectGroup)
}

export const stop = async (session: Session, objectGroup: string) => {
  const result = await GetDisposableStoreSizes.getDisposableStoreSizes(session, objectGroup)
  return result
}

export const releaseResources = async (session: Session, objectGroup: string) => {
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
    after: cleanArray(after),
    before: cleanArray(before),
  }
}

const getTotal = (disposableStoreSizes) => {
  return Arrays.sum(disposableStoreSizes)
}

export const isLeak = ({ after, before }) => {
  return getTotal(after) > getTotal(before)
}
