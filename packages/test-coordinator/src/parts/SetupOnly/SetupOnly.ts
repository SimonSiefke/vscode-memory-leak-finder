import * as LaunchInitializationWorker from '../LaunchInitializationWorker/LaunchInitializationWorker.ts'

export const setupOnly = async ({
  arch,
  clearExtensions,
  commit,
  cwd,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  enableProxy,
  ide,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  platform,
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: {
  arch: string
  clearExtensions: boolean
  commit: string
  cwd: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  enableExtensions: boolean
  enableProxy: boolean
  ide: string
  insidersCommit: string
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  platform: string
  updateUrl: string
  useProxyMock: boolean
  vscodePath: string
  vscodeVersion: string
}): Promise<void> => {
  const rpc = await LaunchInitializationWorker.launchInitializationWorker()
  try {
    await rpc.invoke('Launch.setup', {
      arch,
      clearExtensions,
      commit,
      cwd,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      enableExtensions,
      enableProxy,
      ide,
      insidersCommit,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      platform,
      updateUrl,
      useProxyMock,
      vscodePath,
      vscodeVersion,
    })
  } finally {
    await rpc.dispose()
  }
}
