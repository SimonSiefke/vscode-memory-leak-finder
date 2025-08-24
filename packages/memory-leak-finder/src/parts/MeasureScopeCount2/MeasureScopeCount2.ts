import * as CompareCount from '../CompareCount/CompareCount.ts'
import * as GetScopeCount2 from '../GetScopeCount2/GetScopeCount2.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'

// TODO
// 1. use queryObjects to query all functions
// 2. for all functions, query all properties, including internal#scopeList
// 3. for all scopeListids query all properties
// 4. repeat step 3 until all scope lists have been found
// 5. sum up all unique scope lists counts

export const id = MeasureId.ScopeCount2

export const targets = ['browser', 'node', 'webworker']

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetScopeCount2.getScopeCount2(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetScopeCount2.getScopeCount2(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
