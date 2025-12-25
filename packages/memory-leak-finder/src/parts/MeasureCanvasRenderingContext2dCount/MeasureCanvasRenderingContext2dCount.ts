import type { Session } from '../Session/Session.ts'
import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetCanvasRenderingContext2dCount from '../GetCanvasRenderingContext2dCount/GetCanvasRenderingContext2dCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.CanvasRenderingContext2dCount

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetCanvasRenderingContext2dCount.getCanvasRenderingContext2dCount(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetCanvasRenderingContext2dCount.getCanvasRenderingContext2dCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
