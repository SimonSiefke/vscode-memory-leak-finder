import * as CompareCount from '../CompareCount/CompareCount.js'
import * as GetScopes from '../GetScopes/GetScopes.js'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

// TODO
// 1. use queryObjects to query all functions
// 2. for all functions, query all properties, including internal#scopeList
// 3. for all scopeListids query scope locations
// 4. sum up all unique scope lists by scope location

export const id = MeasureId.Scopes

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetScopes.getScopes(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetScopes.getScopes(session, objectGroup)
}

export const compare = CompareCount.compareCount

export const isLeak = IsLeakCount.isLeakCount
