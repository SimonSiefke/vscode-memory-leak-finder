import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getEraseLine = (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getEraseLine')
}
