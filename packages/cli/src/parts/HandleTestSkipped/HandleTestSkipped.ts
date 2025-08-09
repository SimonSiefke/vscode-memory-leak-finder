import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestSkipped = async (file: string, relativeDirName: string, fileName: string, duration: number): Promise<void> => {
  const message = await StdoutWorker.invoke('Stdout.gethandleTestSkippedMessage', file, relativeDirName, fileName, duration)
  await HandleTestStateChange.handleTestStateChange(message)
}
