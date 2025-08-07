import { createWriteStream } from 'node:fs'

const logPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-charts/log.txt'

const stream = createWriteStream(logPath)

export const log = (...args) => {
  stream.write(JSON.stringify(args))
  console.log(...args)
}
