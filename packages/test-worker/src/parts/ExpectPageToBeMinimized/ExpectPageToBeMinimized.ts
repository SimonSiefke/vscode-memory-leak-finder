import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FunctionExpectElectronWindowToBeMinimized from '../FunctionExpectElectronWindowToBeMinimized/FunctionExpectElectronWindowToBeMinimized.ts'

export const toBeMinimized = async (page) => {
  await DevtoolsProtocolRuntime.callFunctionOn(page.electronRpc, {
    arguments: [
      {
        value: page.targetId,
      },
    ],
    awaitPromise: true,
    functionDeclaration: FunctionExpectElectronWindowToBeMinimized.code,
    objectId: page.electronObjectId,
    returnByValue: true,
  })
}
