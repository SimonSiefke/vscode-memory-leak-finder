import * as StdoutWorker from '../StdoutWorker/StdoutWorker.js'

export const write = async (data) => {
  await StdoutWorker.invoke('Stdout.write', data)
}
