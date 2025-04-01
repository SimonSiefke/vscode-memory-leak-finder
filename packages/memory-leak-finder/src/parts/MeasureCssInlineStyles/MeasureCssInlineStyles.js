import * as CompareCssInlineStyles from '../CompareCssInlineStyles/CompareCssInlineStyles.js'
import * as GetCssInlineStyles from '../GetCssInlineStyles/GetCssInlineStyles.js'
import * as IsLeakCssInlineStyles from '../IsLeakCssInlineStyles/IsLeakCssInlineStyles.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

export const id = MeasureId.CssInlineStyles

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
