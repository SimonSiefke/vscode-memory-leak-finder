import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as FunctionGetElectronAppIsPackaged from '../FunctionGetElectronAppIsPackaged/FunctionGetElectronAppIsPackaged.ts'

export const toBePackaged = async (electronApp) => {
  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronApp.rpc, {
    functionDeclaration: FunctionGetElectronAppIsPackaged.code,
    objectId: electronApp.electronObjectId,
  })
  if (result !== true) {
    throw new ExpectError(`expected app to be packaged but was property was "${result}"`)
  }
}
