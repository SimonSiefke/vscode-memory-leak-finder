import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getTestsUnexpectedErrorMessage = (error: any): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getTestsUnexpectedErrorMessage', error)
}
