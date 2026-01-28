import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import * as Ide from '../Ide/Ide.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as ParseVersion from '../ParseVersion/ParseVersion.ts'

export const launchIde = async ({
  addDisposable,
  arch,
  clearExtensions,
  commit,
  cwd,
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
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
  arch: string
  clearExtensions: boolean
  commit: string
  cwd: string
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
  useProxyMock: boolean
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    const { child, pid } = await LaunchCursor.launchCursor({
      addDisposable,
      clearExtensions,
      cursorVersion,
      cwd,
      enableExtensions,
      enableProxy,
      headlessMode,
      inspectExtensions,
      inspectExtensionsPort,
      inspectPtyHost,
      inspectPtyHostPort,
      inspectSharedProcess,
      inspectSharedProcessPort,
      useProxyMock,
      vscodePath,
    })
    return {
      child,
      parsedVersion: ParseVersion.parseVersion(cursorVersion),
      pid,
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
  const { binaryPath, child, pid } = await LaunchVsCode.launchVsCode({
    addDisposable,
    arch,
    clearExtensions,
    commit,
    cwd,
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
  }
}
