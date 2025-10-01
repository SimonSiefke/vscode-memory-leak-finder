import * as Ide from '../Ide/Ide.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as ParseVersion from '../ParseVersion/ParseVersion.ts'
import * as VscodeVersion from '../VsCodeVersion/VsCodeVersion.ts'

export const launchIde = async ({ headlessMode, cwd, ide, vscodePath, commit, addDisposable, inspectSharedProcess, inspectExtensions, inspectPtyHost }) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    const result = await LaunchCursor.launchCursor({ headlessMode, cwd, cursorVersion, vscodePath, addDisposable, inspectSharedProcess, inspectExtensions, inspectPtyHost })
    return {
      ...result,
      parsedVersion: ParseVersion.parseVersion(cursorVersion),
    }
  }
  const result = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
    vscodeVersion: VscodeVersion.vscodeVersion,
    vscodePath,
    commit,
    addDisposable,
    inspectSharedProcess,
    inspectExtensions,
    inspectPtyHost,
  })
  return {
    ...result,
    parsedVersion: ParseVersion.parseVersion(VscodeVersion.vscodeVersion),
  }
}
