import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FunctionExpectElectronWindowToBeMaximized from '../FunctionExpectElectronWindowToBeMaximized/FunctionExpectElectronWindowToBeMaximized.ts'

export const toBeMaximized = async (page: any) => {
  await DevtoolsProtocolRuntime.callFunctionOn(page.electronRpc, {
    arguments: [
      {
        value: page.targetId,
      },
    ],
    awaitPromise: true,
    functionDeclaration: FunctionExpectElectronWindowToBeMaximized.code,
    objectId: page.electronObjectId,
    returnByValue: true,
  })
}
