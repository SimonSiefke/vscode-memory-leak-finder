import * as CompareLargestArrayCount from '../CompareLargestArrayCount/CompareLargestArrayCount.ts'
import * as GetLargestArrayCount from '../GetLargestArrayCount/GetLargestArrayCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.LargestArrayCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session: Session, objectGroup: string) => {
  const id = 0
  return GetLargestArrayCount.getLargestArrayCount(session, objectGroup, id)
}

export const stop = async (session: Session, objectGroup: string) => {
  const id = 1
  return GetLargestArrayCount.getLargestArrayCount(session, objectGroup, id)
}

export const compare = CompareLargestArrayCount.compareLargestArrayCount

export const isLeak = (leaked) => {
  return true
}
