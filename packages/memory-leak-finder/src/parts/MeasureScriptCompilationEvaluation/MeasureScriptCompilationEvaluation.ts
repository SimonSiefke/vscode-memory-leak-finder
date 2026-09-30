import type { Dynamic, Session } from '../Types/Types.ts'
import * as Capture from '../PerformanceTraceCapture/PerformanceTraceCapture.ts'
import { analyze } from '../ScriptCompilationEvaluation/ScriptCompilationEvaluation.ts'
import * as TargetId from '../TargetId/TargetId.ts'
export const id = 'scriptCompilationEvaluation'
export const targets = [TargetId.Browser]
export const create = Capture.create
export const start = Capture.start
export const stop = async (session: Session, state: Dynamic) => {
  const raw = await Capture.stop(session, state)
  return { ...analyze(raw), raw }
}
export const releaseResources = Capture.releaseResources
export const compare = (_before: Dynamic, after: Dynamic) => ({ ...after, isLeak: false })
export const isLeak = () => false
export const summary = (result: Dynamic) =>
  result.available === false
    ? `Unavailable: ${result.reason}`
    : [
        result.incomplete ? 'Incomplete trace' : 'Renderer trace',
        ...Object.entries(result.metrics).map(([key, value]) => `${key} | ${value}`),
      ].join('\n')
