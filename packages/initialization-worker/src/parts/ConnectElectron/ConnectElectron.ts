import type { RpcConnection } from '../RpcConnection/RpcConnection.ts'
import { applyMonkeyPatches } from '../ApplyMonkeyPatches/ApplyMonkeyPatches.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolDebugger, DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { VError } from '../VError/VError.ts'

const waitForDebuggerToBePaused = async (rpc: RpcConnection) => {
  try {
    const msg = await rpc.once(DevtoolsEventType.DebuggerPaused)
    return msg
  } catch (error) {
    throw new VError(error, `Failed to wait for debugger`)
  }
}

export const connectElectron = async (
  electronRpc: RpcConnection,
  secretsPath: string,
  headlessMode: boolean,
  trackFunctions: boolean,
  openDevtools: boolean,
  port: number,
  preGeneratedWorkbenchPath: string | null,
  measureId?: string,
) => {
  console.error(
    `[macos-ci-debug] connectElectron start headless=${headlessMode} trackFunctions=${trackFunctions} openDevtools=${openDevtools}`,
  )
  const debuggerPausedPromise = waitForDebuggerToBePaused(electronRpc)
  console.error(`[macos-ci-debug] connectElectron enabling debugger/runtime`)
  await Promise.all([
    DevtoolsProtocolDebugger.enable(electronRpc),
    DevtoolsProtocolRuntime.enable(electronRpc),
    DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc),
  ])
  console.error(`[macos-ci-debug] connectElectron waiting for initial Debugger.paused`)
  const msg = await debuggerPausedPromise
  console.error(`[macos-ci-debug] connectElectron got initial Debugger.paused`)
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
  console.error(`[macos-ci-debug] connectElectron got electron object ids electron=${electronObjectId} require=${requireObjectId}`)

  const monkeyPatchedElectronId = await applyMonkeyPatches(
    electronRpc,
    electronObjectId,
    requireObjectId,
    secretsPath,
    headlessMode,
    trackFunctions,
    openDevtools,
    port,
    preGeneratedWorkbenchPath,
    measureId,
  )
  console.error(`[macos-ci-debug] connectElectron applied monkey patches id=${monkeyPatchedElectronId}`)

  await DevtoolsProtocolRuntime.runIfWaitingForDebugger(electronRpc)
  console.error(`[macos-ci-debug] connectElectron resumed electron runtime`)

  return {
    electronObjectId,
    monkeyPatchedElectronId: monkeyPatchedElectronId,
  }
}
