import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const getResolvedSourceMapCachePath = (hash) => {
  return join(Root.root, '.vscode-resolve-source-map-cache', `${hash}.json`)
}
