import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import type { CallgrindConfig } from '../CallgrindConfig/CallgrindConfig.ts'
import * as Ide from '../Ide/Ide.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as ParseVersion from '../ParseVersion/ParseVersion.ts'

export const setupIde = async ({
  arch,
  buildVscodeMinified,
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
  proxyTestFolderName,
  useProxyMock,
  updateUrl,
  vscodePath,
  vscodeVersion,
}: {
  arch: string
  buildVscodeMinified: boolean
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
  proxyTestFolderName?: string
  useProxyMock: boolean
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    await LaunchCursor.setupCursor({
      clearExtensions,
      cursorVersion,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      vscodePath,
    })
    return
  }
  await LaunchVsCode.setupVsCode({
    arch,
    buildVscodeMinified,
    clearExtensions,
    commit,
    downloadUserDataZipFileToken,
    downloadUserDataZipFileUrl,
    enableExtensions,
    insidersCommit,
    platform,
    updateUrl,
    vscodePath,
    vscodeVersion,
  })
}

export const launchIde = async ({
  addDisposable,
  arch,
  buildVscodeMinified,
  callgrindConfig,
  clearExtensions,
  commit,
  cwd,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  enableProxy,
  headlessMode,
  ide,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  platform,
  proxyTestFolderName,
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  arch: string
  buildVscodeMinified: boolean
  callgrindConfig: CallgrindConfig
  clearExtensions: boolean
  commit: string
  cwd: string
  downloadUserDataZipFileToken: string
  downloadUserDataZipFileUrl: string
  enableExtensions: boolean
  enableProxy: boolean
  headlessMode: boolean
  ide: string
  insidersCommit: string
  inspectExtensions: boolean
  inspectExtensionsPort: number
  inspectPtyHost: boolean
  inspectPtyHostPort: number
  inspectSharedProcess: boolean
  inspectSharedProcessPort: number
  platform: string
  proxyTestFolderName: string
  useProxyMock: boolean
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    const { child, pid } = await LaunchCursor.launchCursor({
      addDisposable,
      callgrindConfig,
      clearExtensions,
      cursorVersion,
      cwd,
      downloadUserDataZipFileToken,
      downloadUserDataZipFileUrl,
      enableExtensions,
      enableProxy,
      headlessMode,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      proxyTestFolderName,
      useProxyMock,
      vscodePath,
    })
    return {
      child,
      parsedVersion: ParseVersion.parseVersion(cursorVersion),
      pid,
      proxyWorkerRpc: null,
    }
  }
  let versionToParse: string
  if (insidersCommit) {
    const metadata = await FetchVscodeInsidersMetadata.fetchVscodeInsidersMetadata(platform, arch, insidersCommit, updateUrl)
    const { productVersion } = metadata
    versionToParse = productVersion.replace('-insider', '')
  } else {
    versionToParse = vscodeVersion
  }
  const { binaryPath, child, pid, proxyWorkerRpc } = await LaunchVsCode.launchVsCode({
    addDisposable,
    arch,
    buildVscodeMinified,
    callgrindConfig,
    clearExtensions,
    commit,
    cwd,
    downloadUserDataZipFileToken,
    downloadUserDataZipFileUrl,
    enableExtensions,
    enableProxy,
    headlessMode,
    insidersCommit,
    inspectExtensions,
    inspectExtensionsPort,
    inspectPtyHost,
    inspectPtyHostPort,
    inspectSharedProcess,
    inspectSharedProcessPort,
    platform,
    proxyTestFolderName,
    updateUrl,
    useProxyMock,
    vscodePath,
    vscodeVersion,
  })

  return {
    binaryPath,
    child,
    parsedVersion: ParseVersion.parseVersion(versionToParse),
    pid,
    proxyWorkerRpc,
  }
}
