import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getInitializedMessage = async (time: number): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getInitializedMessage', time)
}
