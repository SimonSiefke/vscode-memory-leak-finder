import * as CompareHeapUsage from '../CompareHeapUsage/CompareHeapUsage.ts'
import * as GetHeapUsage from '../GetHeapUsage/GetHeapUsage.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import type { Session } from '../Session/Session.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.HeapUsage

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session]
}

export const start = (session: Session) => {
  return GetHeapUsage.getHeapUsage(session)
}

export const stop = (session: Session) => {
  return GetHeapUsage.getHeapUsage(session)
}

export const compare = CompareHeapUsage.compareHeapUsage

export const isLeak = ({ usedBefore, usedAfter }) => {
  return usedAfter > usedBefore
}
