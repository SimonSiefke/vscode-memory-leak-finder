import * as CompareEventTargets from '../CompareEventTargets/CompareEventTargets.ts'
import * as GetEventTargets from '../GetEventTargets/GetEventTargets.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.EventTargets

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetEventTargets.getEventTargets(session, objectGroup, undefined)
}

export const stop = (session, objectGroup) => {
  return GetEventTargets.getEventTargets(session, objectGroup, undefined)
}

export const compare = CompareEventTargets.compareEventTargets

const sum = (numbers) => {
  let total = 0
  for (const number of numbers) {
    total += number
  }
  return total
}

const getTotalCount = (items) => {
  const counts = items.map((item) => item.count)
  const total = sum(counts)
  return total
}

export const isLeak = (leaked) => {
  const { before, after } = leaked
  const totalBefore = getTotalCount(before)
  const totalAfter = getTotalCount(after)
  return totalAfter > totalBefore
}
