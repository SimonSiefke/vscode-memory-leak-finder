import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import {
  formatFrontendStartupPerformanceSummary,
  normalizeFrontendStartupPerformance,
} from '../FrontendStartupPerformance/FrontendStartupPerformance.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

const globalName = '__vscodeMemoryLeakFinderFrontendStartupPerformance'

export const id = MeasureId.FrontendStartupPerformance

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  return [session]
}

export const start = async (session: Session) => {
  await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis.${globalName} = []`,
    returnByValue: true,
  })
  return []
}

export const stop = async (session: Session) => {
  const samples = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `Array.isArray(globalThis.${globalName}) ? globalThis.${globalName} : []`,
    returnByValue: true,
  })
  return Array.isArray(samples) ? samples : []
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  const samples = Array.isArray(after) ? after : []
  const metrics = normalizeFrontendStartupPerformance(samples)
  return {
    isLeak: false,
    metrics,
    samples,
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics }: Dynamic) => {
  return formatFrontendStartupPerformanceSummary(metrics || [])
}
