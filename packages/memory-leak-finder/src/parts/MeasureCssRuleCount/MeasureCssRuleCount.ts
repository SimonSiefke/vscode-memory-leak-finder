import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetCssRuleCount from '../GetCssRuleCount/GetCssRuleCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.CssRuleCount

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetCssRuleCount.getCssRuleCount(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetCssRuleCount.getCssRuleCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
