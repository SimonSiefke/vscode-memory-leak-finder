import { readFile } from 'fs/promises'
import { join } from 'path'
import * as ErrorCodes from '../ErrorCodes/ErrorCodes.js'
import * as KillProcess from '../KillProcess/KillProcess.js'
import * as Root from '../Root/Root.js'
import { VError } from '../VError/VError.js'

// in some cases it can happen that after running tests
// vscode is not closed properly and when trying to re-run
// the tests, the debugger connection times out because no
// window is created. The window is created in the
// other vscode instance, which blocks the tests
export const killExistingVsCodeInstances = async () => {
  try {
    const lockPath = join(Root.root, '.vscode-user-data-dir', 'code.lock')
    const content = await readFile(lockPath, 'utf8')
    const pid = parseInt(content)
    if (isNaN(pid)) {
      return
    }
    KillProcess.killProcess(pid)
  } catch (error) {
    if (error && (error.code === ErrorCodes.ENOENT || error.code === ErrorCodes.ESRCH || error.code === ErrorCodes.EPERM)) {
      return
    }
    throw new VError(error, `Failed to kill existing vscode processes`)
  }
}
