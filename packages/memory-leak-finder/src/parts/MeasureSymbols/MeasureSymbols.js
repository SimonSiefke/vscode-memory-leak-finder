import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetSymbols from '../GetSymbols/GetSymbols.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.Symbols

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetSymbols.getSymbols(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetSymbols.getSymbols(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = (before, after) => {
  return false
}
