import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const formatStack = async (stack: string, relativeFilePath: string): Promise<string> => {
  return StdoutWorker.invoke('Stdout.formatStack', stack, relativeFilePath)
}
