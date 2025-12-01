import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const print = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getInterruptedMessage')
}
