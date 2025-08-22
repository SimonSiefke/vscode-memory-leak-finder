import * as CompareNamedEmitterCount from '../CompareNamedEmitterCount/CompareNamedEmitterCount.ts'
import * as GetNamedEmitterCount from '../GetNamedEmitterCount/GetNamedEmitterCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as WriteScriptMap from '../WriteScriptMap/WriteScriptMap.ts'

export const id = MeasureId.NamedEmitterCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  const id = 0
  const result = await GetNamedEmitterCount.getNamedEmitterCount(session, objectGroup, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  return result
}

export const stop = async (session, objectGroup, scriptHandler) => {
  const id = 1
  const result = await GetNamedEmitterCount.getNamedEmitterCount(session, objectGroup, id)
  await WriteScriptMap.writeScriptMap(scriptHandler.scriptMap, id)
  await scriptHandler.stop(session)
  return result
}

export const compare = CompareNamedEmitterCount.compareNamedEmitterCount

export const isLeak = () => {
  return true
}
