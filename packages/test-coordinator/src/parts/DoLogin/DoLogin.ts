import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'

export interface LoginOptions {
  readonly arch: string
  readonly attachedToPageTimeout: number
  readonly clearExtensions: boolean
  readonly commit: string
  readonly compressVideo: boolean
  readonly connectionId: number
  readonly cwd: string
  readonly enableExtensions: boolean
  readonly enableProxy: boolean
  readonly filterValue: string
  readonly headlessMode: boolean
  readonly ide: any
  readonly ideVersion: any
  readonly idleTimeout: number
  readonly insidersCommit: string
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly measure: string
  readonly measureNode: boolean
  readonly openDevtools: boolean
  readonly pageObjectPathResolved: string
  readonly platform: string
  readonly recordVideo: boolean
  readonly runMode: number
  readonly screencastQuality: number
  readonly timeouts: any
  readonly trackFunctions: boolean
  readonly updateUrl: string
  readonly useProxyMock: boolean
  readonly vscodePath: string
  readonly vscodeVersion: string
}

export const doLogin = async ({
  arch,
  attachedToPageTimeout,
  clearExtensions,
  commit,
  compressVideo,
  connectionId,
  cwd,
  enableExtensions,
  enableProxy,
  filterValue,
  headlessMode,
  ide,
  ideVersion,
  idleTimeout,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  measure,
  measureNode,
  openDevtools,
  pageObjectPathResolved,
  platform,
  recordVideo,
  runMode,
  screencastQuality,
  timeouts,
  trackFunctions,
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: LoginOptions): Promise<RunTestsResult> => {
  const { functionTrackerRpc, initializationWorkerRpc, memoryRpc, testWorkerRpc, videoRpc } =
    await PrepareTestsOrAttach.prepareTestsAndAttach({
      arch,
      attachedToPageTimeout,
      clearExtensions,
      commit,
      compressVideo,
      connectionId,
      cwd,
      enableExtensions,
      enableProxy,
      headlessMode,
      ide,
      ideVersion,
      idleTimeout,
      insidersCommit,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      measureId: measure,
      measureNode,
      openDevtools,
      pageObjectPath: pageObjectPathResolved,
      platform,
      recordVideo,
      runMode,
      screencastQuality,
      timeouts,
      trackFunctions,
      updateUrl,
      useProxyMock,
      vscodePath,
      vscodeVersion,
    })
  // Wait for user to interrupt (Ctrl+C) or terminate the process
  const { promise, resolve } = Promise.withResolvers<void>()
  const cleanup = async () => {
    await testWorkerRpc.dispose()
    await memoryRpc?.dispose()
    await videoRpc?.dispose()
    await functionTrackerRpc?.dispose()
    if (initializationWorkerRpc) {
      await initializationWorkerRpc.dispose()
    }
    resolve()
  }
  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
  // The IDE is now running. User can login manually and then press Ctrl+C when done
  await promise
  return {
    duration: 0,
    failed: 0,
    filterValue,
    leaked: 0,
    passed: 0,
    skipped: 0,
    skippedFailed: 0,
    total: 0,
    type: 'success',
  }
}
