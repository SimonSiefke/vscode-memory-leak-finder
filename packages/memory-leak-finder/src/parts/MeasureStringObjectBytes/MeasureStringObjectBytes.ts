import type { Session } from '../Session/Session.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as StringObjectMeasure from '../StringObjectMeasure/StringObjectMeasure.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.StringObjectBytes
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => StringObjectMeasure.create(session, id)
export const start = (session: Session, state: StringObjectMeasure.StringObjectMeasureState): Promise<string> =>
  StringObjectMeasure.start(session, state)
export const stop = (session: Session, state: StringObjectMeasure.StringObjectMeasureState): Promise<string> =>
  StringObjectMeasure.stop(session, state)
export const compare = (beforePath: string, afterPath: string) => StringObjectMeasure.compare(beforePath, afterPath, 'bytes')
export const isLeak = IsLeakCount.isLeakCount
export const releaseResources = (session: Session, state: StringObjectMeasure.StringObjectMeasureState): Promise<void> =>
  StringObjectMeasure.releaseResources(session, state)
