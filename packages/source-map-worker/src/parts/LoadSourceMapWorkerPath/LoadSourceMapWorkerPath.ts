import { join } from 'path'
import * as Root from '../Root/Root.js'

export const loadSourceMapWorkerPath: string = join(Root.root, 'packages', 'load-source-map-worker', 'src', 'loadSourceMapWorkerMain.ts')
