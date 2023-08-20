import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as DevtoolsTargetType from '../DevtoolsTargetType/DevtoolsTargetType.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as TargetState from '../TargetState/TargetState.js'

export const waitForWebWorker = async ({ sessionId }) => {
  const worker = await TargetState.waitForTarget({ type: 'worker', index: 0 })
  const session = SessionState.getSession(worker.sessionId)
  return {
    type: DevtoolsTargetType.Worker,
    async evaluate({ expression }) {
      const rpc = session.rpc
      const result = await DevtoolsProtocolRuntime.evaluate(rpc, {
        expression,
        returnByValue: true,
        generatePreview: true,
      })
      return result
    },
  }
}
