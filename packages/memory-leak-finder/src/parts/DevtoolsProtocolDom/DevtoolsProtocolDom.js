import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as UnwrapDevtoolsEvaluateResult from '../UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js'

export const describeNode = async (session, options) => {
  const rawResult = await session.invoke(DevtoolsCommandType.DomDescribeNode, options)
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult)
  return result
}
