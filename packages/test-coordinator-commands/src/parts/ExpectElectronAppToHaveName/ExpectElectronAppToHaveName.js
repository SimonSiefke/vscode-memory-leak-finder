import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import { ExpectError } from '../ExpectError/ExpectError.js'
import * as FunctionGetElectronAppName from '../FunctionGetElectronAppName/FunctionGetElectronAppName.js'

export const toHaveName = async (electronApp, expectedName) => {
  const result = await DevtoolsProtocolRuntime.callFunctionOn(electronApp.rpc, {
    functionDeclaration: FunctionGetElectronAppName.code,
    objectId: electronApp.electronObjectId,
  })
  if (result !== expectedName) {
    throw new ExpectError(`expected app name to be "${expectedName}" but was "${result}"`)
  }
}
