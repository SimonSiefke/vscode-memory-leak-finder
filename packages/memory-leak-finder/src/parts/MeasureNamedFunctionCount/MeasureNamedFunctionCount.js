import * as CompareNamedFunctionCount from '../CompareNamedFunctionCount/CompareNamedFunctionCount.js'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

// TODO
// 1. query all function locations and names
// 2. run test case
// 3. query all function locations and names again
// 4. compare before and after function locations

export const id = MeasureId.NamedFunctionCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup)
}

export const compare = CompareNamedFunctionCount.compareNamedFunctionCount

export const isLeak = () => {
  return false
}
