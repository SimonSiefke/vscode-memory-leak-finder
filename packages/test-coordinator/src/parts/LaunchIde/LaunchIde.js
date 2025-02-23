import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as LaunchCursor from '../LaunchCursor/LaunchCursor.js'
import * as Ide from '../Ide/Ide.js'

export const launchIde = async ({ headlessMode, cwd, ide }) => {
  if (ide === Ide.Cursor) {
    return LaunchCursor.launchCursor({ headlessMode, cwd })
  }
  return LaunchVsCode.launchVsCode({ headlessMode, cwd })
}
