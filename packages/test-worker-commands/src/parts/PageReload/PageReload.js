import VError from 'verror'
import * as DevtoolsProtocolPage from '../DevtoolsProtocolPage/DevtoolsProtocolPage.js'
import * as PTimeout from '../PTimeout/PTimeout.js'

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
