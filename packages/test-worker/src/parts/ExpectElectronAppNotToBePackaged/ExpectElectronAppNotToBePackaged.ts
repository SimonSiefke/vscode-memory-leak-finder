import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { ExpectError } from '../ExpectError/ExpectError.ts'
import * as FunctionGetElectronAppIsPackaged from '../FunctionGetElectronAppIsPackaged/FunctionGetElectronAppIsPackaged.ts'

export const notToBePackaged = async (electronApp) => {
  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronApp.rpc, {
    functionDeclaration: FunctionGetElectronAppIsPackaged.code,
    objectId: electronApp.electronObjectId,
  })
  if (result !== false) {
    throw new ExpectError(`expected app not to be packaged but was property was "${result}"`)
  }
}
