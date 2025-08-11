import { join } from 'node:path'
import * as Root from '../Root/Root.js'

export const videoRecordingWorkerPath = join(Root.root, 'packages', 'video-recording-worker', 'bin', 'video-recording-worker.js')
