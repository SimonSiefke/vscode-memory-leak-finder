import { compareNamedFunctionCount2 } from '../CompareNamedFunctionCount2/CompareNamedFunctionCount2.js'
import * as GetNamedFunctionCount2 from '../GetNamedFunctionCount2/GetNamedFunctionCount2.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.NamedFunctionCount2

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  const includeSourceMap = true
  const id = 0
  return GetNamedFunctionCount2.getNamedFunctionCount2(session, objectGroup, scriptHandler.scriptMap, includeSourceMap, id)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const includeSourceMap = true
  const id = 0
  return GetNamedFunctionCount2.getNamedFunctionCount2(session, objectGroup, scriptHandler.scriptMap, includeSourceMap, id)
}

export const compare = compareNamedFunctionCount2

export const isLeak = (leaked) => {
  return leaked.length > 0
}
