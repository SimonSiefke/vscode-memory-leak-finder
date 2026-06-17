import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getUserDataDir = (platform: string = process.platform) => {
  if (platform === 'darwin') {
    return join('/tmp', `vmlf-${process.pid}-ud`)
  }
  return join(Root.root, '.vscode-user-data-dir')
}
