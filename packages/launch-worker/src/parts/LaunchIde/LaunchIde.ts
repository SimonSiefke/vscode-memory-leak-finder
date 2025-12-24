import * as FetchVscodeInsidersMetadata from '../FetchVscodeInsidersMetadata/FetchVscodeInsidersMetadata.ts'
import * as Ide from '../Ide/Ide.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as ParseVersion from '../ParseVersion/ParseVersion.ts'

export const launchIde = async ({
  addDisposable,
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
  vscodePath,
  vscodeVersion,
}) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    const result = await LaunchCursor.launchCursor({
      addDisposable,
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
  const result = await LaunchVsCode.launchVsCode({
    addDisposable,
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
    vscodePath,
    vscodeVersion,
  })
  let versionToParse: string
  if (insidersCommit) {
    const metadata = await FetchVscodeInsidersMetadata.fetchVscodeInsidersMetadata(insidersCommit)
    const productVersion = metadata.productVersion
    versionToParse = productVersion.replace('-insider', '')
  } else {
    versionToParse = vscodeVersion
  }
  return {
    ...result,
    parsedVersion: ParseVersion.parseVersion(versionToParse),
  }
}
