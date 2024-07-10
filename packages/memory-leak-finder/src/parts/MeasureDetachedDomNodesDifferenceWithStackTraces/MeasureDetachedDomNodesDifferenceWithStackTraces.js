import * as Arrays from '../Arrays/Arrays.js'
import * as Assert from '../Assert/Assert.js'
import * as CompareDetachedDomNodesWithStackTraces from '../CompareDetachedDomNodesWithStackTraces/CompareDetachedDomNodesWithStackTraces.js'
import * as GetDetachedDomNodes from '../GetDetachedDomNodes/GetDetachedDomNodes.js'
import * as GetDetachedDomNodesWithStackTraces from '../GetDetachedDomNodesWithStackTraces/GetDetachedDomNodesWithStackTraces.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as StartTrackingDomNodeStackTraces from '../StartTrackingDomNodeStackTraces/StartTrackingDomNodeStackTraces.js'
import * as StopTrackingDomNodeStackTraces from '../StopTrackingDomNodeStackTraces/StopTrackingDomNodeStackTraces.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.DetachedDomNodesDifferenceWithStackTraces

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  await StartTrackingDomNodeStackTraces.startTrackingDomNodeStackTraces(session, objectGroup)
  return GetDetachedDomNodes.getDetachedDomNodes(session, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetDetachedDomNodesWithStackTraces.getDetachedDomNodesWithStackTraces(session, objectGroup, scriptHandler.scriptMap)
  await StopTrackingDomNodeStackTraces.stopTrackingDomNodeStackTraces(session, objectGroup)
  return result
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDetachedDomNodesWithStackTraces.compareDetachedDomNodesWithStackTraces

const getCount = (instance) => {
  return instance.count
}

const getTotal = (instance) => {
  Assert.array(instance)
  const counts = instance.map(getCount)
  return Arrays.sum(counts)
}

export const isLeak = ({ before, after }) => {
  return getTotal(after) > getTotal(before)
}
