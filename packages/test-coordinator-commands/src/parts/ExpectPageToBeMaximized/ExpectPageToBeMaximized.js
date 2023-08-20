import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as FunctionExpectElectronWindowToBeMaximized from '../FunctionExpectElectronWindowToBeMaximized/FunctionExpectElectronWindowToBeMaximized.js'

export const toBeMaximized = async (page) => {
  await DevtoolsProtocolRuntime.callFunctionOn(page.electronRpc, {
    objectId: page.electronObjectId,
    returnByValue: true,
    functionDeclaration: FunctionExpectElectronWindowToBeMaximized.code,
    awaitPromise: true,
    arguments: [
      {
        value: page.targetId,
      },
    ],
  })
}
