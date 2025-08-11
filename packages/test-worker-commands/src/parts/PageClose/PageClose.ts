import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'

export const close = async (rpc) => {
  const result = await PTimeout.pTimeout(DevtoolsProtocolPage.close(rpc, {}), {
    milliseconds: 1000,
  })
  return result
}
