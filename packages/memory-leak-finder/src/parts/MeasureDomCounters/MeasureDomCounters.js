import * as GetDomCounters from '../GetDomCounters/GetDomCounters.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.DomCounters

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetDomCounters.getDomCounters(session)
}

export const stop = (session) => {
  return GetDomCounters.getDomCounters(session)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = () => {
  return false
}
