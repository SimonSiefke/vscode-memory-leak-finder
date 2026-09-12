import type { Session } from '../Session/Session.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as PerformanceMarkMeasure from '../PerformanceMarkMeasure/PerformanceMarkMeasure.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.PerformanceMarkBytes
export const targets = [TargetId.Browser]

export const create = (session: Session) => PerformanceMarkMeasure.create(session, id)
export const start = (session: Session, state: PerformanceMarkMeasure.PerformanceMarkMeasureState): Promise<string> =>
  PerformanceMarkMeasure.start(session, state)
export const stop = (session: Session, state: PerformanceMarkMeasure.PerformanceMarkMeasureState): Promise<string> =>
  PerformanceMarkMeasure.stop(session, state)
export const compare = (beforePath: string, afterPath: string) => PerformanceMarkMeasure.compare(beforePath, afterPath, 'bytes')
export const isLeak = IsLeakCount.isLeakCount
export const releaseResources = (session: Session, state: PerformanceMarkMeasure.PerformanceMarkMeasureState): Promise<void> =>
  PerformanceMarkMeasure.releaseResources(session, state)
