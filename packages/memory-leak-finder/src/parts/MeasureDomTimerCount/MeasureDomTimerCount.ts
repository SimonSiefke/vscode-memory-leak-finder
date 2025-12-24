import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import { getHeapSnapshot } from '../GetHeapSnapshot/GetHeapSnapshot.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import * as WriteScriptMap from '../WriteScriptMap/WriteScriptMap.ts'

export const id = MeasureId.DomTimerCount

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session: Session, objectGroup: string, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  const id = 0
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  return heapSnapshotPath
}

export const stop = async (session: Session, objectGroup: string, scriptHandler: IScriptHandler) => {
  const id = 1
  const heapSnapshotPath = await getHeapSnapshot(session, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  await scriptHandler.stop(session)
  return heapSnapshotPath
}

export const isLeak = ({ after, before }) => {
  return after > before
}

export { compareDomTimerCount as compare } from '../CompareDomTimerCount/CompareDomTimerCount.ts'
