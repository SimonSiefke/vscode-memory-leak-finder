import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const videoRecordingWorkerPath = join(Root.root, 'packages', 'video-recording-worker', 'bin', 'video-recording-worker.ts')
