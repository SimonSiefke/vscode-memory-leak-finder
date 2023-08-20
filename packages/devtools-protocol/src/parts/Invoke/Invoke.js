import * as UnwrapDevtoolsEvaluateResult from '../UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js'

export const invoke = async (session, command, options) => {
  const rawResult = await session.invoke(command, options)
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)
  return result
}
