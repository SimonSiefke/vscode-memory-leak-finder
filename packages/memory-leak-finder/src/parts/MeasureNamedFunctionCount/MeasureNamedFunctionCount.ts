// deprecated in favor of namedFunctionCount2, which works with heapsnapshot
// whereas this queries chrome for all function locations individually, crashing chrome
import * as CompareNamedFunctionCount from '../CompareNamedFunctionCount/CompareNamedFunctionCount.ts'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'

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
