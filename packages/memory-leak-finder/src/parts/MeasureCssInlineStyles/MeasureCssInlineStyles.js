import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetCssInlineStyles from '../GetCssInlineStyles/GetCssInlineStyles.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
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

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
