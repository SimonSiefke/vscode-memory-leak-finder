import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FunctionExpectElectronWindowTitle from '../FunctionExpectElectronWindowTitle/FunctionExpectElectronWindowTitle.ts'

export const toHaveBounds = async (page: any, x: any, y: any, width: any, height: any) => {
  // TODO pass expected bounds as arguments
  // @ts-ignore
  const title = await DevtoolsProtocolRuntime.callFunctionOn(page.electronRpc, {
    arguments: [
      {
        value: page.targetId,
      },
    ],
    awaitPromise: true,
    functionDeclaration: FunctionExpectElectronWindowTitle.code,
    objectId: page.electronObjectId,
    returnByValue: true,
  })
}
