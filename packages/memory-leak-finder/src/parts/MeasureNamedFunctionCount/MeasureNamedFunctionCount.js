import * as CompareNamedFunctionCount from '../CompareNamedFunctionCount/CompareNamedFunctionCount.js'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.NamedFunctionCount

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap)
}

export const compare = CompareNamedFunctionCount.compareNamedFunctionCount

export const isLeak = (leaked) => {
  return leaked.length > 0
}
