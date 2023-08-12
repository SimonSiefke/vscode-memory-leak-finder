import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as UnwrapDevtoolsEvaluateResult from '../UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js'

export const getEventListeners = async (session, options) => {
  const rawResult = await session.invoke(DevtoolsCommandType.DomDebuggerGetEventListeners, options)
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)
  return result
}
