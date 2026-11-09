import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as CpuProfile from '../CpuProfile/CpuProfile.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'

interface CpuProfileState {
  readonly scriptHandler: IScriptHandler
}

export const id = MeasureId.CpuProfile

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session, { scriptHandler: ScriptHandler.create() } satisfies CpuProfileState]
}

export const start = async (session: Session, state: CpuProfileState) => {
  await state.scriptHandler.start(session)
  await DevtoolsProtocolProfiler.enable(session, {})
  await DevtoolsProtocolProfiler.start(session, {})
  return CpuProfile.getCpuProfileSummary({})
}

export const stop = async (session: Session, state: CpuProfileState) => {
  const result = await DevtoolsProtocolProfiler.stop(session, {})
  await state.scriptHandler.stop(session)
  return {
    profile: result?.profile || result,
    scriptMap: state.scriptHandler.scriptMap,
  }
}

export const releaseResources = async (session: Session) => {
  await DevtoolsProtocolProfiler.disable(session, {})
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  const profile = after?.profile || after
  const summary = CpuProfile.getCpuProfileSummary(profile)
  return {
    isLeak: false,
    metrics: summary.metrics,
    raw: {
      after,
      before: _before,
    },
    scriptMap: after?.scriptMap || {},
    topSelfTime: summary.topSelfTime,
    topTotalTime: summary.topTotalTime,
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics, topSelfTime, topTotalTime }: Dynamic) => {
  return CpuProfile.formatCpuProfileSummary({ metrics, topSelfTime, topTotalTime })
}
