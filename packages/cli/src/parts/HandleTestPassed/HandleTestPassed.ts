import * as HandleTestStateChange from '../HandleTestStateChange/HandleTestStateChange.ts'
import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const handleTestPassed = async (file: string, relativeDirName: string, fileName: string, duration: number, isLeak: boolean): Promise<void> => {
  const message = await StdoutWorker.invoke('Stdout.getHandleTestPassedMessage', file, relativeDirName, fileName, duration, isLeak)
  await HandleTestStateChange.handleTestStateChange(message)
}
