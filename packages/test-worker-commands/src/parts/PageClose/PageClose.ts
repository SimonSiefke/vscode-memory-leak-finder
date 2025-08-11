import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as PTimeout from '../PTimeout/PTimeout.js'

export const close = async (rpc) => {
  const result = await PTimeout.pTimeout(DevtoolsProtocolPage.close(rpc, {}), {
    milliseconds: 1000,
  })
  return result
}
