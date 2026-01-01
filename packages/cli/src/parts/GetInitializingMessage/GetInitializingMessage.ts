import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

// TODO when initialization is done, clear the intializing message and print instead that initialization is done with the time it took
export const getInitializingMessage = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getInitializingMessage')
}
