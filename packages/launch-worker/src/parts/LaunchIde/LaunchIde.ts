import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import * as Ide from '../Ide/Ide.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as ParseVersion from '../ParseVersion/ParseVersion.ts'

export const launchIde = async ({
  addDisposable,
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
  useProxyMock,
  updateUrl,
  vscodePath,
  vscodeVersion,
}: {
  addDisposable: (fn: () => Promise<void> | void) => void
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
  useProxyMock: boolean
  updateUrl: string
  vscodePath: string
  vscodeVersion: string
}) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    const result = await LaunchCursor.launchCursor({
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
      ...result,
      parsedVersion: ParseVersion.parseVersion(cursorVersion),
    }
  }
  let versionToParse: string
  if (insidersCommit) {
    const metadata = await FetchVscodeInsidersMetadata.fetchVscodeInsidersMetadata(insidersCommit, updateUrl)
    const { productVersion } = metadata
    versionToParse = productVersion.replace('-insider', '')
  } else {
    versionToParse = vscodeVersion
  }
  const result = await LaunchVsCode.launchVsCode({
    addDisposable,
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
    useProxyMock,
    updateUrl,
    vscodePath,
    vscodeVersion,
  })

  return {
    ...result,
    parsedVersion: ParseVersion.parseVersion(versionToParse),
  }
}
