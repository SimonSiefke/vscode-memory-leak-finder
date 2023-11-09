import * as GetArrayElementCount from '../GetArrayElementCount/GetArrayElementCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'

export const id = MeasureId.ArrayElementCount

export const create = (session) => {
  return [session]
}

export const start = (session) => {
  return GetArrayElementCount.getArrayElementCount(session)
}

export const stop = (session) => {
  return GetArrayElementCount.getArrayElementCount(session)
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
