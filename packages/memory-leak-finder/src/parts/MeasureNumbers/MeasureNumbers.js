import * as CompareNumbers from '../CompareNumbers/CompareNumbers.js'
import * as GetNumbers from '../GetNumbers/GetNumbers.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'

export const id = MeasureId.Numbers

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const result = await GetNumbers.getNumbers(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const stop = async (session, objectGroup) => {
  const result = await GetNumbers.getNumbers(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareNumbers.compareNumbers

export const isLeak = () => {
  return true
}
