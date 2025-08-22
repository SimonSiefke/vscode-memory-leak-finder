import * as GetDomTimerCount from '../GetDomTimerCount/GetDomTimerCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as WriteScriptMap from '../WriteScriptMap/WriteScriptMap.ts'

export const id = MeasureId.DomTimerCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  const id = 0
  const result = await GetDomTimerCount.getDomTimerCount(session, objectGroup, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  return result
}

export const stop = async (session, objectGroup, scriptHandler) => {
  const id = 1
  const result = await GetDomTimerCount.getDomTimerCount(session, objectGroup, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  await scriptHandler.stop(session)
  return result
}

export const compare = (before, after) => {
  return { before, after }
}

export const isLeak = ({ before, after }) => {
  return after > before
}
