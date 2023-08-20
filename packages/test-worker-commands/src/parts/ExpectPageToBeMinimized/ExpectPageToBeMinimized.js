import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as FunctionExpectElectronWindowToBeMinimized from '../FunctionExpectElectronWindowToBeMinimized/FunctionExpectElectronWindowToBeMinimized.js'

export const toBeMinimized = async (page) => {
  await DevtoolsProtocolRuntime.callFunctionOn(page.electronRpc, {
    objectId: page.electronObjectId,
    returnByValue: true,
    functionDeclaration: FunctionExpectElectronWindowToBeMinimized.code,
    awaitPromise: true,
    arguments: [
      {
        value: page.targetId,
      },
    ],
  })
}
