import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getTestClearMessage = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getTestClearMessage')
}
