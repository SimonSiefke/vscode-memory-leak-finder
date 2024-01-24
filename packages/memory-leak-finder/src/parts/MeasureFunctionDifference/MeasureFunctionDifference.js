import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as StartTrackingFunctions from '../StartTrackingFunctions/StartTrackingFunctions.js'
import * as StopTrackingFunctions from '../StopTrackingFunctions/StopTrackingFunctions.js'
import * as CompareFunctionDifference from '../CompareFunctionDifference/CompareFunctionDifference.js'

export const id = MeasureId.FunctionDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptMap = Object.create(null)
  const handleScriptParsed = (event) => {
    const { url, scriptId, sourceMapURL } = event.params
    if (!url) {
      return
    }
    scriptMap[scriptId] = {
      url,
      sourceMapUrl: sourceMapURL,
    }
  }
  session.on('Debugger.scriptParsed', handleScriptParsed)
  return [session, objectGroup, scriptMap, handleScriptParsed]
}

export const start = async (session, objectGroup) => {
  await session.invoke('Debugger.enable')
  return StartTrackingFunctions.startTrackingFunctions(session, objectGroup)
}

export const stop = async (session, objectGroup, scriptMap, handleScriptParsed) => {
  session.off('Debugger.scriptParsed', handleScriptParsed)
  await session.invoke('Debugger.disable')
  const result = await StopTrackingFunctions.stopTrackingFunctions(session, objectGroup)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return {
    result,
    scriptMap,
  }
}

export const compare = CompareFunctionDifference.compareFunctionDifference

export const isLeak = () => {
  return false
}
