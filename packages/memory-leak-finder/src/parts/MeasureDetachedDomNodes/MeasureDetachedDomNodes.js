import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

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

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = ({ before, after }) => {
  return after > before
}
