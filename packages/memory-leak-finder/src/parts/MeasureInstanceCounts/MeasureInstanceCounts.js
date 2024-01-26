import * as Arrays from '../Arrays/Arrays.js'
import * as CompareInstanceCounts from '../CompareInstanceCounts/CompareInstanceCounts.js'
import * as GetInstanceCountsWithConstructorLocations from '../GetInstanceCountsWithConstructorLocations/GetInstanceCountsWithConstructorLocations.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.InstanceCounts

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetInstanceCountsWithConstructorLocations.getInstanceCountsWithConstructorLocations(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetInstanceCountsWithConstructorLocations.getInstanceCountsWithConstructorLocations(
    session,
    objectGroup,
    scriptHandler.scriptMap,
  )
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return result
}

export const compare = CompareInstanceCounts.compareInstanceCounts

const getCount = (value) => {
  return value.count
}

const getTotalCount = (instances) => {
  return Arrays.sum(instances.map(getCount))
}

export const isLeak = ({ before, after }) => {
  return getTotalCount(after) > getTotalCount(before)
}
