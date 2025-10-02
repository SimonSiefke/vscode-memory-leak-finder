import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getUserDataDir = () => {
  return join(Root.root, '.vscode-user-data-dir')
}
