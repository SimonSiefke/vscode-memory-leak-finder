import { join } from '../Path/Path.js'
import * as Root from '../Root/Root.js'

export const getVscodeRuntimeDir = () => {
  const runtimeDir = join(Root.root, '.vscode-runtime-dir')
  // vscode doesn't allow a socket file that is longer than 107 characters
  // the socket file is ~30 characters longer than runtimeDir
  if (runtimeDir.length > 70) {
    return ''
  }
  return runtimeDir
}
