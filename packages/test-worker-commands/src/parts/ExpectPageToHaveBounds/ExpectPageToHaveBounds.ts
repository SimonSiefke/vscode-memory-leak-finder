import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FunctionExpectElectronWindowTitle from '../FunctionExpectElectronWindowTitle/FunctionExpectElectronWindowTitle.ts'

export const toHaveBounds = async (page, x, y, width, height) => {
  // TODO pass expected bounds as arguments
  // @ts-ignore
  const title = await DevtoolsProtocolRuntime.callFunctionOn(page.electronRpc, {
    objectId: page.electronObjectId,
    returnByValue: true,
    functionDeclaration: FunctionExpectElectronWindowTitle.code,
    awaitPromise: true,
    arguments: [
      {
        value: page.targetId,
      },
    ],
  })
}
