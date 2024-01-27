import * as CompareDetachedDomNodesDifference from '../CompareDetachedDomNodesDifference/CompareDetachedDomNodesDifference.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.DetachedDomNodesDifference

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session)
}

export const stop = (session) => {
  return GetDetachedDomNodes.getDetachedDomNodes(session)
}

export const compare = CompareDetachedDomNodesDifference.compareDetachedDomNodesDifference

export const isLeak = ({ before, after }) => {
  return after.length > before.length
}
