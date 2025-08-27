import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetCssStyleSheetCount from '../GetCssStyleSheetCount/GetCssStyleSheetCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.CssStyleSheetCount

export const targets = [TargetId.Browser]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetCssStyleSheetCount.getCssStyleSheetCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetCssStyleSheetCount.getCssStyleSheetCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
