import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetSymbols from '../GetSymbols/GetSymbols.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

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
