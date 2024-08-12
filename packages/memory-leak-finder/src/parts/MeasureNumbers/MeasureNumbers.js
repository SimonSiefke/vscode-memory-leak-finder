import * as CompareNumbers from '../CompareNumbers/CompareNumbers.js'
import * as GetNumbers from '../GetNumbers/GetNumbers.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.Numbers

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetNumbers.getNumbers(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetNumbers.getNumbers(session, objectGroup)
}

export const compare = CompareNumbers.compareNumbers

export const isLeak = () => {
  return true
}
