import * as DevtoolsCommandType from '../DevtoolsCommandType/DevtoolsCommandType.js'
import * as Invoke from '../Invoke/Invoke.js'

export const describeNode = (session, options) => {
  return Invoke.invoke(session, DevtoolsCommandType.DomDescribeNode, options)
}
