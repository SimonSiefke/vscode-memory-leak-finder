import type { Dynamic } from '../Types/Types.ts'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
export const getResolvedSourceMapCachePath = (hash: Dynamic) => {
  return join(Root.root, '.vscode-resolve-source-map-cache', `${hash}.json`)
}
