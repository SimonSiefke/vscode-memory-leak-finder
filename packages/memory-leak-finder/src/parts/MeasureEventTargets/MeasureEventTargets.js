import * as CompareEventTargets from '../CompareEventTargets/CompareEventTargets.js'
import * as GetEventTargets from '../GetEventTargets/GetEventTargets.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.EventTargets

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetEventTargets.getEventTargets(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetEventTargets.getEventTargets(session, objectGroup)
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
