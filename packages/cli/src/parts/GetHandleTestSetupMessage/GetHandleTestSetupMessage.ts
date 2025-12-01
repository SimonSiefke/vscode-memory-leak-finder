import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getHandleTestSetupMessage = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getHandleTestSetupMessage')
}
