import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const setWindowContentSizeScript = `async function (targetId, width, height) {
  const electron = this
  const { BrowserWindow, webContents } = electron
  const targetWebContents = webContents.fromDevToolsTargetId?.(targetId)
  const browserWindow = targetWebContents
    ? BrowserWindow.fromWebContents(targetWebContents)
    : BrowserWindow.getAllWindows()[0]
  if (!browserWindow) {
    throw new Error('browser window not found')
  }

  if (browserWindow.isFullScreen()) {
    await new Promise((resolve) => {
      browserWindow.once('leave-full-screen', resolve)
      browserWindow.setFullScreen(false)
    })
  }
  if (browserWindow.isMaximized()) {
    await new Promise((resolve) => {
      browserWindow.once('unmaximize', resolve)
      browserWindow.unmaximize()
    })
  }

  browserWindow.setContentSize(width, height, false)
  const [actualWidth, actualHeight] = browserWindow.getContentSize()
  if (actualWidth !== width || actualHeight !== height) {
    throw new Error(
      \`expected browser window content size \${width}x\${height}, got \${actualWidth}x\${actualHeight}\`
    )
  }
}`

export const setWindowContentSize = async (
  electronRpc: { invoke(method: string, params?: unknown): Promise<unknown> },
  electronObjectId: string,
  targetId: string,
  width: number,
  height: number,
): Promise<void> => {
  await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    arguments: [{ value: targetId }, { value: width }, { value: height }],
    awaitPromise: true,
    functionDeclaration: setWindowContentSizeScript,
    objectId: electronObjectId,
  })
}
