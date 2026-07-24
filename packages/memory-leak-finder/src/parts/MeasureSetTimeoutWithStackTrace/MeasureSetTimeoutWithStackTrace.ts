import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as TimeoutCount from '../TimeoutCount/TimeoutCount.ts'

export const id = MeasureId.SetTimeoutWithStackTrace

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = async (session: Session, objectGroup: string) => {
  await TimeoutCount.startTrackingTimeouts(session, objectGroup)
  return []
}

export const stop = async (session: Session, objectGroup: string) => {
  const result = await TimeoutCount.getTimeoutsWithStackTraces(session)
  await TimeoutCount.stopTrackingTimeouts(session, objectGroup)
  return result
}

export const compare = (before: readonly Dynamic[], after: readonly Dynamic[], context: Dynamic) => {
  const grouped = new Map<string, Dynamic>()
  for (const item of after) {
    const stack = item.stack || ''
    const existing = grouped.get(stack)
    if (existing) {
      existing.count++
    } else {
      grouped.set(stack, {
        count: 1,
        delay: item.delay,
        stack: stack.split('\n'),
      })
    }
  }
  return [...grouped.values()].filter((item) => item.count >= context.runs)
}

export const isLeak = (result: readonly Dynamic[]) => {
  return result.length > 0
}
