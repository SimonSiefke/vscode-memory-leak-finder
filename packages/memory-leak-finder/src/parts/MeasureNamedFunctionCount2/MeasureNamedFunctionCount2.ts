import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as WriteScriptMap from '../WriteScriptMap/WriteScriptMap.ts'

export const id = MeasureId.NamedFunctionCount2

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  const id = 0
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  return heapSnapshotPath
}

export const stop = async (session, objectGroup, scriptHandler) => {
  const id = 1
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  await scriptHandler.stop(session)
  return {
    heapSnapshotPath,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}

export { compareNamedFunctionCount2 as compare } from '../CompareNamedFunctionCount2/CompareNamedFunctionCount2.ts'
