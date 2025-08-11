import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getCursorLeft = (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getCursorLeft')
}
