import * as ConnectFunctionTracker from '../ConnectFunctionTracker/ConnectFunctionTracker.ts'
import * as PrepareBoth from '../PrepareBoth/PrepareBoth.ts'

export const commandMap = {
  'Initialize.connectFunctionTracker': ConnectFunctionTracker.connectFunctionTracker,
  'Initialize.prepare': PrepareBoth.prepareBoth,
}
