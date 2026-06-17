import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as Assert from '../Assert/Assert.ts'
import * as CommandMapRef from '../CommandMapRef/CommandMapRef.ts'
import * as MemoryLeakWorkerUrl from '../MemoryLeakWorkerUrl/MemoryLeakWorkerUrl.ts'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.ts'

interface ExternalRuntimeInfo {
  readonly args: readonly string[]
  readonly command: string
  readonly inspectPort: number
  readonly pid: number
  readonly runtimeName: string
}

const matchesProcess = (runtimeInfo: ExternalRuntimeInfo, inspectProcess: string): boolean => {
  const values = [runtimeInfo.command, ...runtimeInfo.args]
  return values.some((value) => value.includes(inspectProcess))
}

export const startWorker = async (
  devtoolsWebsocketUrl: string,
  electronWebSocketUrl: string,
  connectionId: number,
  measureId: string,
  attachedToPageTimeout: number,
  measureNode: boolean,
  inspectSharedProcess: boolean,
  inspectExtensions: boolean,
  inspectIntegratedBrowser: boolean,
  inspectPtyHost: boolean,
  inspectPtyHostPort: number,
  inspectSharedProcessPort: number,
  inspectExtensionsPort: number,
  pid: number,
  excludedTargetIds: readonly string[],
  inspectProcess = '',
  testWorkerRpc?: any,
) => {
  Assert.string(devtoolsWebsocketUrl)
  const externalRuntimeInfo =
    inspectProcess && testWorkerRpc
      ? ((await testWorkerRpc.invoke(TestWorkerCommandType.GetExternalRuntimeInfo, connectionId)) as ExternalRuntimeInfo)
      : undefined
  if (externalRuntimeInfo && !matchesProcess(externalRuntimeInfo, inspectProcess)) {
    throw new Error(
      `Expected external runtime command to include ${JSON.stringify(inspectProcess)} but got ${[
        externalRuntimeInfo.command,
        ...externalRuntimeInfo.args,
      ].join(' ')}`,
    )
  }
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: CommandMapRef.commandMapRef,
    path: MemoryLeakWorkerUrl.memoryLeakWorkerUrl,
    stdio: 'inherit',
  })
  await rpc.invoke(
    'ConnectDevtools.connectDevtools',
    devtoolsWebsocketUrl,
    electronWebSocketUrl,
    connectionId,
    measureId,
    attachedToPageTimeout,
    measureNode,
    inspectSharedProcess,
    inspectExtensions,
    inspectIntegratedBrowser,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    pid,
    excludedTargetIds,
    Boolean(externalRuntimeInfo),
    externalRuntimeInfo?.inspectPort ?? 0,
    externalRuntimeInfo?.runtimeName ?? '',
  )
  return rpc
}
