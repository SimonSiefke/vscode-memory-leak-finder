import { compareNamedFunctionCount2 } from '../CompareNamedFunctionCount2/CompareNamedFunctionCount2.ts'
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'

export const id = MeasureId.NamedFunctionCount2

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  const id = 0
  return getHeapSnapshot(session, id)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const id = 1
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  return {
    heapSnapshotPath,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = compareNamedFunctionCount2

export const isLeak = (leaked) => {
  return leaked.length > 0
}
