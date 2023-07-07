import { Console } from 'node:console'
import { createWriteStream } from 'node:fs'

const createConsole = () => {
  const logFile = `/tmp/test-worker-log.txt`
  const writeStream = createWriteStream(logFile)
  const logger = new Console(writeStream)
  return logger
}

const logStream = createConsole()

export const log = (message) => {
  logStream.log(message)
}
