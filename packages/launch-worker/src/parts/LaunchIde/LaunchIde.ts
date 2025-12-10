import * as Ide from '../Ide/Ide.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as ParseVersion from '../ParseVersion/ParseVersion.ts'

export const launchIde = async ({
  headlessMode,
  cwd,
  ide,
  vscodePath,
  vscodeVersion,
  commit,
  addDisposable,
  inspectSharedProcess,
  inspectExtensions,
  inspectPtyHost,
  enableExtensions,
  inspectPtyHostPort,
  inspectSharedProcessPort,
  inspectExtensionsPort,
  enableProxy,
  useProxyMock,
}) => {
  console.log(`[LaunchIde] enableProxy parameter: ${enableProxy} (type: ${typeof enableProxy})`)
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    const result = await LaunchCursor.launchCursor({
      headlessMode,
      cwd,
      cursorVersion,
      vscodePath,
      addDisposable,
      inspectSharedProcess,
      inspectExtensions,
      inspectPtyHost,
      enableExtensions,
      inspectPtyHostPort,
      inspectSharedProcessPort,
      inspectExtensionsPort,
      enableProxy,
      useProxyMock,
    })
    return {
      ...result,
      parsedVersion: ParseVersion.parseVersion(cursorVersion),
    }
  }
  const result = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
    vscodeVersion,
    vscodePath,
    commit,
    addDisposable,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
    enableExtensions,
    inspectPtyHostPort,
    inspectSharedProcessPort,
    inspectExtensionsPort,
    enableProxy,
    useProxyMock,
  })
  return {
    ...result,
    parsedVersion: ParseVersion.parseVersion(vscodeVersion),
  }
}
