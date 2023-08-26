import VError from 'verror'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.js'
import * as PTimeout from '../PTimeout/PTimeout.js'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.js'

export const waitForDebuggerToBePaused = async (rpc) => {
  try {
    const msg = await PTimeout.pTimeout(rpc.once(DevtoolsEventType.DebuggerPaused), {
      milliseconds: TimeoutConstants.WaitForDebuggerToBePaused,
    })
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}
