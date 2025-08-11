import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as FunctionGetElectronAppVersion from '../FunctionGetElectronAppVersion/FunctionGetElectronAppVersion.js'

export const toHaveVersion = async (electronApp, expectedVersion) => {
  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronApp.rpc, {
    functionDeclaration: FunctionGetElectronAppVersion.code,
    objectId: electronApp.electronObjectId,
  })
  if (result !== expectedVersion) {
    throw new ExpectError(`expected app to have version ${expectedVersion} but was property was "${result}"`)
  }
}
