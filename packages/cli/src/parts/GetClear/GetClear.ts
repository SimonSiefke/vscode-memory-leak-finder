import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getClear = (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getClear')
}
