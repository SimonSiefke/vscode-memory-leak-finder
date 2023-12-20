import * as GetDisposablesWithLocation from '../GetDisposablesWithLocation/GetDisposablesWithLocation.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'

// TODO
// 1. query all objects
// 2. check for each object if it has a dispose method to find all disposables
// 3. for each disposable, if object has a constructor, return constructor
//  location else location of disposable function
// 4. group disposables by function location (constructor location / disposable function location)
// 5. sort grouped disposables by count

export const id = MeasureId.Disposables

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  return [session, objectGroup]
}

export const start = (session, objectGroup) => {
  return GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup)
}

export const stop = (session, objectGroup) => {
  return GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup)
}

export const compare = (before, after) => {
  return {
    before,
    after,
  }
}

export const isLeak = ({ before, after }) => {
  return false
}
