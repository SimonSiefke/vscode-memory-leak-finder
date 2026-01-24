import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const getExtensionSourceMapWorkerPath = (): string => {
  return join(Root.root, 'packages', 'extension-source-maps', 'src', 'extensionSourceMapWorkerMain.ts')
}
