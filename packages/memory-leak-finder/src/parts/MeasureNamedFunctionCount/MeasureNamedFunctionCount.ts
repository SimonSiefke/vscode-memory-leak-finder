import * as TargetId from '../TargetId/TargetId.ts'
// deprecated in favor of namedFunctionCount2, which works with heapsnapshot
// whereas this queries chrome for all function locations individually, crashing chrome
import * as CompareNamedFunctionCount from '../CompareNamedFunctionCount/CompareNamedFunctionCount.ts'
import * as GetNamedFunctionCount from '../GetNamedFunctionCount/GetNamedFunctionCount.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'

export const id = MeasureId.NamedFunctionCount

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap, false as any)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  return GetNamedFunctionCount.getNamedFunctionCount(session, objectGroup, scriptHandler.scriptMap, false as any)
}

export const compare = CompareNamedFunctionCount.compareNamedFunctionCount

export const isLeak = (leaked) => {
  return leaked.length > 0
}
