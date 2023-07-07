import { createWriteStream } from 'node:fs'

const logStream = createWriteStream('/tmp/test-worker-log.txt')

export const log = (message) => {
  logStream.write('exiting')
}
