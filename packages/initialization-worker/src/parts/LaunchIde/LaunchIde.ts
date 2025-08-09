import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.ts'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.ts'
import * as Ide from '../Ide/Ide.ts'
import * as VscodeVersion from '../VsCodeVersion/VsCodeVersion.ts'

export const launchIde = async ({ headlessMode, cwd, ide, vscodePath, commit, addDisposable }) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    return LaunchCursor.launchCursor({ headlessMode, cwd, cursorVersion, vscodePath, addDisposable })
  }
  return LaunchVsCode.launchVsCode({ headlessMode, cwd, vscodeVersion: VscodeVersion.vscodeVersion, vscodePath, commit, addDisposable })
}
