import { join } from 'path'
import * as Root from '../Root/Root.js'

export const getUserDataDir = () => {
  return join(Root.root, '.vscode-user-data-dir')
}
