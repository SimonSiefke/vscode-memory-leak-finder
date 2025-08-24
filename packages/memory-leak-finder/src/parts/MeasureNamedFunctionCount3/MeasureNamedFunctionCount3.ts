import type { Session } from '../Session/Session.ts'
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as WriteScriptMap from '../WriteScriptMap/WriteScriptMap.ts'

export const id = MeasureId.NamedFunctionCount3

export const create = (session, context?) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler, context]
}

export const start = async (session: Session, objectGroup: string, scriptHandler: any): Promise<string> => {
  await scriptHandler.start(session)
  const id = 0
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  return heapSnapshotPath
}

export const stop = async (session: Session, objectGroup: string, scriptHandler: any): Promise<string> => {
  const id = 1
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  await scriptHandler.stop(session)
  return heapSnapshotPath
}

export const isLeak = (leaked) => {
  return leaked.length > 0
}

export { compareNamedFunctionCount3 as compare } from '../CompareNamedFunctionCount3/CompareNamedFunctionCount3.ts'
