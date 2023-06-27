import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.js'
import * as Stdout from '../Stdout/Stdout.js'

export const handleTestRunning = (file, relativeDirName, fileName) => {
  const message = GetHandleTestRunningMessage.getHandleTestRunningMessage(file, relativeDirName, fileName)
  Stdout.write(message)
}
