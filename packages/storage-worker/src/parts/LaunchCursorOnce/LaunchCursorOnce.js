import { spawn } from 'child_process'
import { setTimeout } from 'node:timers/promises'
import { join } from 'path'
import * as GetExtensionsDir from '../GetExtensionsDir/GetExtensionsDir.js'
import * as GetUserDataDir from '../GetUserDataDir/GetUserDataDir.js'
import * as GetVscodeArgs from '../GetVsCodeArgs/GetVsCodeArgs.js'
import * as Root from '../Root/Root.js'

export const launchCursorOnce = async () => {
  // TODO
  // 1. launch
  // 2. close
  // 3. verify storage path has been created
  const userDataDir = GetUserDataDir.getUserDataDir()
  const extensionsDir = GetExtensionsDir.getExtensionsDir()
  const args = GetVscodeArgs.getVscodeArgs({ userDataDir, extensionsDir, extraLaunchArgs: [] })
  const cursorPath = join(Root.root, '.vscode-tool-downloads', 'squashfs-root', 'cursor')
  const child = spawn(cursorPath, args)
  // TODO don't use numeric timeout, maybe connect with devtools debugger and verify
  // the initial page is loaded
  await setTimeout(6000)
  child.kill('SIGKILL')
  await setTimeout(6000)
}
