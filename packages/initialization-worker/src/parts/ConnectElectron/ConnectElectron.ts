import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as MakeElectronAvailableGlobally from '../MakeElectronAvailableGlobally/MakeElectronAvailableGlobally.ts'
import * as MakeRequireAvailableGlobally from '../MakeRequireAvailableGlobally/MakeRequireAvailableGlobally.ts'
import { monkeyPatchElectronHeadlessMode } from '../MonkeyPatchElectronHeadlessMode/MonkeyPatchElectronHeadlessMode.ts'
import * as MonkeyPatchElectronScript from '../MonkeyPatchElectronScript/MonkeyPatchElectronScript.ts'
<<<<<<< HEAD
import { protocolInterceptorScript } from '../ProtocolInterceptorScript/ProtocolInterceptorScript.ts'
=======
import * as MonkeyPatchElectronIpcMain from '../MonkeyPatchElectronScript/MonkeyPatchElectronIpcMain.ts'
>>>>>>> origin/main
import { VError } from '../VError/VError.ts'

interface RpcConnection {
  dispose(): Promise<void>
  invoke(method: string, params?: unknown): Promise<unknown>
  once(event: string): Promise<{ params: { callFrames: Array<{ callFrameId: string }> } }>
}

const waitForDebuggerToBePaused = async (rpc: RpcConnection) => {
  try {
    const msg = await rpc.once(DevtoolsEventType.DebuggerPaused)
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}

<<<<<<< HEAD
export const connectElectron = async (
  electronRpc: RpcConnection,
  headlessMode: boolean,
  trackFunctions: boolean,
  openDevtools: boolean,
  port: number,
  preGeneratedWorkbenchPath: string | null,
) => {
=======
export const connectElectron = async (electronRpc: RpcConnection, headlessMode: boolean, measureId?: string) => {
>>>>>>> origin/main
  const debuggerPausedPromise = waitForDebuggerToBePaused(electronRpc)
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  const msg = await debuggerPausedPromise
  const callFrame = msg.params.callFrames[0]
  const { callFrameId } = callFrame

  // TODO do this in parallel
  const electron = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require('electron')`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })
  const require = await DevtoolsProtocolDebugger.evaluateOnCallFrame(electronRpc, {
    callFrameId,
    expression: `require`,
    generatePreview: true,
    includeCommandLineAPI: true,
  })

  const electronObjectId = electron.result.result.objectId
  const requireObjectId = require.result.result.objectId

  // TODO headlessmode

  const monkeyPatchedElectron = await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
    functionDeclaration: MonkeyPatchElectronScript.monkeyPatchElectronScript,
    objectId: electronObjectId,
  })

  if (measureId && (measureId === 'ipcMessageCount' || measureId === 'ipcmessagecount')) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: MonkeyPatchElectronIpcMain.monkeyPatchElectronIpcMain,
      objectId: electronObjectId,
    })
  }

  if (headlessMode) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: monkeyPatchElectronHeadlessMode,
      objectId: electronObjectId,
    })
  }

  await Promise.all([
    MakeElectronAvailableGlobally.makeElectronAvailableGlobally(electronRpc, electronObjectId),
    MakeRequireAvailableGlobally.makeRequireAvailableGlobally(electronRpc, requireObjectId),
  ])

  if (trackFunctions) {
    await DevtoolsProtocolRuntime.callFunctionOn(electronRpc, {
      functionDeclaration: protocolInterceptorScript(port, preGeneratedWorkbenchPath),
      objectId: electronObjectId,
    })
  }

  if (openDevtools) {
    const openDevtoolsScript = `(function () {
      const electron = globalThis._____electron
      const { BrowserWindow } = electron
      const intervalId = setInterval(() => {
        const focusedWindow = BrowserWindow.getFocusedWindow()
        if (focusedWindow) {
          clearInterval(intervalId)
          focusedWindow.webContents.openDevTools()
        }
      }, 100)
    })()`
    await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      expression: openDevtoolsScript,
      awaitPromise: false,
    })
  }

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)

  return {
    electronObjectId,
    monkeyPatchedElectronId: monkeyPatchedElectron.objectId,
  }
}
