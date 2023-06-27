import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as FunctionGetElectronAppIsPackaged from '../FunctionGetElectronAppIsPackaged/FunctionGetElectronAppIsPackaged.js'

export const toBePackaged = async (electronApp) => {
  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronApp.rpc, {
    functionDeclaration: FunctionGetElectronAppIsPackaged.code,
    objectId: electronApp.electronObjectId,
  })
  if (result !== true) {
    throw new ExpectError(`expected app to be packaged but was property was "${result}"`)
  }
}
