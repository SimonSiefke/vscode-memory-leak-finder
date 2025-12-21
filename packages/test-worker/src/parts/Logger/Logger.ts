import { Console } from 'node:console'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const createConsole = () => {
  const tmpDir = tmpdir()
  const logFile = join(tmpDir, 'workr-log.txt')
  const writeStream = createWriteStream(logFile)
  const logger = new Console(writeStream)
  return logger
}

const logStream = createConsole()

export const log = (message) => {
  logStream.log(message)
}
