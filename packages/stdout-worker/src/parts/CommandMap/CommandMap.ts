import * as GetAllTestsFinishedMessage from '../GetAllTestsFinishedMessage/GetAllTestsFinishedMessage.ts'
import * as GetAnsiEscapes from '../GetAnsiEscapes/GetAnsiEscapes.ts'
import * as GetGitHubFileErrorMessage from '../GetGitHubFileErrorMessage/GetGitHubFileErrorMessage.ts'
import * as GetGitHubGroupEndMessage from '../GetGitHubGroupEndMessage/GetGitHubGroupEndMessage.ts'
import * as GetGitHubGroupStartMessage from '../GetGitHubGroupStartMessage/GetGitHubGroupStartMessage.ts'
import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.ts'
import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'
import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'
import * as GetInterruptedMessage from '../GetInterruptedMessage/GetInterruptedMessage.ts'
import * as GetPatternUsageMessage from '../GetPatternUsageMessage/GetPatternUsageMessage.ts'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.ts'
import * as GetWatchUsageMessage from '../GetWatchUsageMessage/GetWatchUsageMessage.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'Stdout.getAllTestsFinishedMessage': GetAllTestsFinishedMessage.getAllTestsFinishedMessage,
  'Stdout.getBackspace': GetAnsiEscapes.getBackspace,
  'Stdout.getClear': GetAnsiEscapes.getClear,
  'Stdout.getCursorBackward': GetAnsiEscapes.getCursorBackward,
  'Stdout.getCursorLeft': GetAnsiEscapes.getCursorLeft,
  'Stdout.getCursorUp': GetAnsiEscapes.getCursorUp,
  'Stdout.getEraseDown': GetAnsiEscapes.getEraseDown,
  'Stdout.getEraseEndLine': GetAnsiEscapes.getEraseEndLine,
  'Stdout.getEraseLine': GetAnsiEscapes.getEraseLine,
  'Stdout.getEraseScreen': GetAnsiEscapes.getEraseScreen,
  'Stdout.getGitHubFileErrorMessage': GetGitHubFileErrorMessage.getGitHubFileErrorMessage,
  'Stdout.getGitHubGroupEndMessage': GetGitHubGroupEndMessage.getGitHubGroupEndMessage,
  'Stdout.getGitHubGroupStartMessage': GetGitHubGroupStartMessage.getGitHubGroupStartMessage,
  'Stdout.getHandleTestFailedMessage': GetHandleTestFailedMessage.getHandleTestFailedMessage,
  'Stdout.getHandleTestPassedMessage': GetHandleTestPassedMessage.getHandleTestPassedMessage,
  'Stdout.getHandleTestRunningMessage': GetHandleTestRunningMessage.getHandleTestRunningMessage,
  'Stdout.getHandleTestSetupMessage': GetHandleTestSetupMessage.getHandleTestSetupMessage,
  'Stdout.gethandleTestSkippedMessage': GetHandleTestSkippedMessage.getHandleTestSkippedMessage,
  'Stdout.getInterruptedMessage': GetInterruptedMessage.getInterruptedMessage,
  'Stdout.getPatternUsageMessage': GetPatternUsageMessage.getPatternUsageMessage,
  'Stdout.getTestClearMessage': GetTestClearMessage.getTestClearMessage,
  'Stdout.getWatchUsageMessage': GetWatchUsageMessage.getWatchUsageMessage,
}
