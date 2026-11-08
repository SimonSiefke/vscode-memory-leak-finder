import type { Session } from '../Session/Session.ts'
import * as MeasureDeadClosureVariables from '../MeasureDeadClosureVariables/MeasureDeadClosureVariables.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

export { create, start, stop, targets, releaseResources, isLeak } from '../MeasureDeadClosureVariables/MeasureDeadClosureVariables.ts'
export const id = MeasureId.DeadClosureVariablesTotal

export const compare = (
  beforePath: string,
  afterPath: string,
  context?: unknown,
  session?: Session,
  state?: MeasureDeadClosureVariables.DeadClosureVariablesState,
) => MeasureDeadClosureVariables.compare(beforePath, afterPath, context, session, state, { mode: 'total' })
