import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.ts'
import * as GetDisposablesWithLocation from '../GetDisposablesWithLocation/GetDisposablesWithLocation.ts'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'

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
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
  return {
    result,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDisposablesWithLocation.compareDisposablesWithLocation

export const isLeak = IsLeakDisposables.isLeakDisposables
