import type { Dynamic } from '../Types/Types.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as GetPromisesWithStackTraces from '../GetPromisesWithStackTraces/GetPromisesWithStackTraces.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StartTrackPromiseStackTraces from '../StartTrackPromiseStackTraces/StartTrackingPromiseStackTraces.ts'
import * as StopTrackingPromiseStackTraces from '../StopTrackPromiseStackTraces/StopTrackingPromiseStackTraces.ts'
import * as TargetId from '../TargetId/TargetId.ts'
export const id = MeasureId.PromisesWithStackTrace
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
interface State {
  readonly objectGroup1: string
  readonly objectGroup2: string
  readonly scriptHandler: IScriptHandler
  scriptHandlerStarted: boolean
  tracking: boolean
}
export const create = (session: Session) => {
  const state: State = {
    objectGroup1: ObjectGroupId.create(),
    objectGroup2: ObjectGroupId.create(),
    scriptHandler: ScriptHandler.create(),
    scriptHandlerStarted: false,
    tracking: false,
  }
  return [session, state] as const
}
export const prepare = async (session: Session, state: State) => {
  if (state.tracking) {
    return
  }
  state.tracking = true
  try {
    await StartTrackPromiseStackTraces.startTrackingPromiseStackTraces(session, state.objectGroup1)
  } finally {
    await ReleaseObjectGroup.releaseObjectGroup(session, state.objectGroup1)
  }
}
export const releaseResources = async (session: Session, state: State) => {
  try {
    if (state.tracking) {
      state.tracking = false
      await StopTrackingPromiseStackTraces.stopTrackingPromiseStackTraces(session, state.objectGroup2)
    }
  } finally {
    try {
      if (state.scriptHandlerStarted) {
        state.scriptHandlerStarted = false
        await state.scriptHandler.stop(session)
      }
    } finally {
      await Promise.all([
        ReleaseObjectGroup.releaseObjectGroup(session, state.objectGroup1),
        ReleaseObjectGroup.releaseObjectGroup(session, state.objectGroup2),
      ])
    }
  }
}
export const start = async (session: Session, state: State) => {
  await prepare(session, state)
  state.scriptHandlerStarted = true
  await state.scriptHandler.start(session)
  try {
    return await GetPromisesWithStackTraces.getPromisesWithStackTraces(session, state.objectGroup1)
  } finally {
    // The inspector's query result must not keep baseline promises alive.
    await ReleaseObjectGroup.releaseObjectGroup(session, state.objectGroup1)
  }
}
export const stop = async (session: Session, state: State) => {
  try {
    const promises = await GetPromisesWithStackTraces.getPromisesWithStackTraces(session, state.objectGroup2)
    return { result: promises, scriptMap: state.scriptHandler.scriptMap }
  } finally {
    await releaseResources(session, state)
  }
}
export const isLeak = (leaked: Dynamic) => {
  return leaked.length > 0
}
export { comparePromisesWithStackTrace as compare } from '../ComparePromisesWithStackTrace/ComparePromisesWithStackTrace.ts'
