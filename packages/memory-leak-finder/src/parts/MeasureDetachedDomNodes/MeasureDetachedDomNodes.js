import * as CompareDetachedDomNodes from '../CompareDetachedDomNodes/CompareDetachedDomNodes.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as Arrays from '../Arrays/Arrays.js'

export const id = MeasureId.DetachedDomNodes

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session)
}

export const stop = (session) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session)
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
