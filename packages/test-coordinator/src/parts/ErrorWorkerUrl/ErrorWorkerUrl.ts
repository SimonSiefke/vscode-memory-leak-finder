import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const errorWorkerUrl = join(Root.root, 'packages/error-worker/bin/error-worker.js')
