import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as CpuProfile from '../CpuProfile/CpuProfile.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const id = MeasureId.CpuProfile

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  return [session]
}

export const start = async (session: Session) => {
  await DevtoolsProtocolProfiler.enable(session, {})
  await DevtoolsProtocolProfiler.start(session, {})
  return CpuProfile.getCpuProfileSummary({})
}

export const stop = async (session: Session) => {
  const result = await DevtoolsProtocolProfiler.stop(session, {})
  return result?.profile || result
}

export const releaseResources = async (session: Session) => {
  await DevtoolsProtocolProfiler.disable(session, {})
}

const getPerformanceSamples = (context: Dynamic): readonly Dynamic[] => {
  if (!Array.isArray(context?.testRunResults)) {
    return []
  }
  return context.testRunResults
    .map((result: Dynamic) => result?.performanceScenario)
    .filter((result: Dynamic) => result && typeof result.latencyMs === 'number')
}

export const compare = (_before: Dynamic, after: Dynamic, context?: Dynamic) => {
  const summary = CpuProfile.getCpuProfileSummary(after)
  return {
    isLeak: false,
    metrics: summary.metrics,
    performanceSamples: getPerformanceSamples(context),
    raw: {
      after,
      before: _before,
    },
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
