import * as CompareNumbers from '../CompareNumbers/CompareNumbers.ts'
import * as GetNumbers from '../GetNumbers/GetNumbers.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

export const id = MeasureId.Numbers

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session, objectGroup) => {
  const result = await GetNumbers.getNumbers(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const stop = async (session, objectGroup) => {
  const result = await GetNumbers.getNumbers(session, objectGroup)
  return result
}

export const compare = CompareNumbers.compareNumbers

export const isLeak = () => {
  return true
}
