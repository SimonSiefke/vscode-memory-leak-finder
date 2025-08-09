import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getExtensionsDir = () => {
  return join(Root.root, '.vscode-extensions')
}
