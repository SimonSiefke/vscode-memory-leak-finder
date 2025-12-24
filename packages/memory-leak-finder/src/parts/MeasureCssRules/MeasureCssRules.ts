import * as GetCssRules from '../GetCssRules/GetCssRules.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import type { Session } from '../Session/Session.ts'

export const id = MeasureId.CssRules

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session: Session, objectGroup: string) => {
  return GetCssRules.getCssRules(session, objectGroup)
}

export const stop = (session: Session, objectGroup: string) => {
  return GetCssRules.getCssRules(session, objectGroup)
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}

export { compareCssRules as compare } from '../CompareCSSRules/CompareCSSRules.ts'
