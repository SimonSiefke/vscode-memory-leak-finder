import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetWidgetCount from '../GetWidgetCount/GetWidgetCount.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

export const id = MeasureId.WidgetCount

export const targets = ['browser']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetWidgetCount.getWidgetCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetWidgetCount.getWidgetCount(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
