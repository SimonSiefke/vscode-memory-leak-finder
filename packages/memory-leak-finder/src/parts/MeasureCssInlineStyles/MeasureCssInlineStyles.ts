import * as CompareCssInlineStyles from '../CompareCssInlineStyles/CompareCssInlineStyles.ts'
import * as GetCssInlineStyles from '../GetCssInlineStyles/GetCssInlineStyles.ts'
import * as IsLeakCssInlineStyles from '../IsLeakCssInlineStyles/IsLeakCssInlineStyles.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.CssInlineStyles

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetCssInlineStyles.getCssInlineStyles(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetCssInlineStyles.getCssInlineStyles(session, objectGroup)
}

export const compare = CompareCssInlineStyles.compareCssInlineStyles

export const isLeak = IsLeakCssInlineStyles.isLeakCssInlineStyles
