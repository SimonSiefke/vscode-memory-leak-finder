import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.js'
import * as Ide from '../Ide/Ide.js'

export const launchIde = async ({ headlessMode, cwd, ide }) => {
  if (ide === Ide.Cursor) {
    const cursorVersion = '0.45.14' // TODO make it configurable
    return LaunchCursor.launchCursor({ headlessMode, cwd, cursorVersion })
  }
  return LaunchVsCode.launchVsCode({ headlessMode, cwd })
}
