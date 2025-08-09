import * as GetAllTestsFinishedMessage from '../GetAllTestsFinishedMessage/GetAllTestsFinishedMessage.ts'
import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.ts'
import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'
import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'Stdout.getHandleTestFailedMessage': GetHandleTestFailedMessage.getHandleTestFailedMessage,
  'Stdout.getAllTestsFinishedMessage': GetAllTestsFinishedMessage.getAllTestsFinishedMessage,
  'Stdout.getHandleTestPassedMessage': GetHandleTestPassedMessage.getHandleTestPassedMessage,
  'Stdout.getHandleTestRunningMessage': GetHandleTestRunningMessage.getHandleTestRunningMessage,
  'Stdout.getHandleTestSetupMessage': GetHandleTestSetupMessage.getHandleTestSetupMessage,
  'Stdout.gethandleTestSkippedMessage': GetHandleTestSkippedMessage.getHandleTestSkippedMessage,
}
