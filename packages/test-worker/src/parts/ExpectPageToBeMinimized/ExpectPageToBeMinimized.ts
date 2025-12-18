import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FunctionExpectElectronWindowToBeMinimized from '../FunctionExpectElectronWindowToBeMinimized/FunctionExpectElectronWindowToBeMinimized.ts'

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
