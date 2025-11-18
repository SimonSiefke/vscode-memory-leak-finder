import { compareCssRules } from '../CompareCSSRules/CompareCSSRules.ts'
import * as GetCssRules from '../GetCssRules/GetCssRules.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.CssRules

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetCssRules.getCssRules(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetCssRules.getCssRules(session, objectGroup)
}

export const compare = compareCssRules

export const isLeak = (leaked) => {
  return leaked.length > 0
}
