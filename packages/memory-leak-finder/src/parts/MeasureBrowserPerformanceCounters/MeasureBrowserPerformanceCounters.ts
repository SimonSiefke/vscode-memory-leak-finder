import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import {
  formatBrowserPerformanceMetricsSummary,
  normalizeBrowserPerformanceMetrics,
} from '../BrowserPerformanceMetrics/BrowserPerformanceMetrics.ts'
import * as GetBrowserPerformanceMetrics from '../GetBrowserPerformanceMetrics/GetBrowserPerformanceMetrics.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { DevtoolsProtocolPerformance } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const id = MeasureId.BrowserPerformanceCounters

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

export const start = async (session: Session) => {
  await DevtoolsProtocolPerformance.enable(session, {})
  return GetBrowserPerformanceMetrics.getBrowserPerformanceMetrics(session)
}

export const stop = (session: Session) => {
  return GetBrowserPerformanceMetrics.getBrowserPerformanceMetrics(session)
}

export const releaseResources = async (session: Session) => {
  await DevtoolsProtocolPerformance.disable(session, {})
}

export const compare = (before: Dynamic, after: Dynamic) => {
  const metrics = normalizeBrowserPerformanceMetrics(before, after)
  return {
    isLeak: false,
    metrics,
    raw: {
      after,
      before,
    },
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics }: Dynamic) => {
  return formatBrowserPerformanceMetricsSummary(metrics)
}
