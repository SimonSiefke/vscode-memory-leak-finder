import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as FunctionGetElectronAppIsPackaged from '../FunctionGetElectronAppIsPackaged/FunctionGetElectronAppIsPackaged.js'

export const notToBePackaged = async (electronApp) => {
  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronApp.rpc, {
    functionDeclaration: FunctionGetElectronAppIsPackaged.code,
    objectId: electronApp.electronObjectId,
  })
  if (result !== false) {
    throw new ExpectError(`expected app not to be packaged but was property was "${result}"`)
  }
}
