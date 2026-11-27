import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as LibuvHandleCensus from '../LibuvHandleCensus/LibuvHandleCensus.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.LibuvHandleCensus
export const targets = [TargetId.Node]
export const create = (session: Session) => [session] as const
// A single evaluation per snapshot; nothing is installed in the target.
export const start = (session: Session): Promise<LibuvHandleCensus.Snapshot> =>
  DevtoolsProtocolRuntime.evaluate(session, {
    expression: LibuvHandleCensus.expression,
    returnByValue: true,
  })
export const stop = start
export const compare = LibuvHandleCensus.compare
export const isLeak = () => false
export const summary = LibuvHandleCensus.summary
