import * as DevtoolsProtocolRuntime from '../DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js'
import * as FunctionExpectElectronWindowTitle from '../FunctionExpectElectronWindowTitle/FunctionExpectElectronWindowTitle.js'

export const toHaveBounds = async (page, x, y, width, height) => {
  // TODO pass expected bounds as arguments
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
