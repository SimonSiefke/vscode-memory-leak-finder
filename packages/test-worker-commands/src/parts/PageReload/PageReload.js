import * as DevtoolsProtocolPage from '../DevtoolsProtocolPage/DevtoolsProtocolPage.js'
import * as PTimeout from '../PTimeout/PTimeout.js'

export const reload = async (rpc) => {
  const result = await PTimeout.pTimeout(DevtoolsProtocolPage.reload(rpc, {}), {
    milliseconds: 1000,
  })
  return result
}
