import { VError } from '../VError/VError.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'

export const reload = async (rpc) => {
  try {
    const result = await PTimeout.pTimeout(DevtoolsProtocolPage.reload(rpc, {}), {
      milliseconds: 5000,
    })
    return result
  } catch (error) {
    throw new VError(error, `Failed to reload page`)
  }
}
