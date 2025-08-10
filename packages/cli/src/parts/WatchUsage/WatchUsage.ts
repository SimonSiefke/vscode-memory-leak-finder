import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const print = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getWatchUsageMessage')
}

export const clearAndPrint = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getWatchUsageMessageFull')
}

export const printShowDetails = async (): Promise<string> => {
  return StdoutWorker.invoke('Stdout.getWatchUsageShowDetailsMessage')
}
