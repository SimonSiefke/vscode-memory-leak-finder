import * as Arrays from '../Arrays/Arrays.js'
import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.DetachedDomNodeRoots

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetDetachedDomNodes.getDetachedDomNodes(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareDetachedDomNodes.compareDetachedDomNodes

const getCount = (instance) => {
  return instance.count
}

const getTotal = (instance) => {
  const counts = instance.map(getCount)
  return Arrays.sum(counts)
}

export const isLeak = ({ before, after }) => {
  return getTotal(after) > getTotal(before)
}
