import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as GetAllTestsFinishedMessage from '../GetAllTestsFinishedMessage/GetAllTestsFinishedMessage.ts'
import * as GetAnsiEscapes from '../GetAnsiEscapes/GetAnsiEscapes.ts'
import * as GetGitHubFileErrorMessage from '../GetGitHubFileErrorMessage/GetGitHubFileErrorMessage.ts'
import * as GetHandleTestFailedMessage from '../GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts'
import * as GetHandleTestPassedMessage from '../GetHandleTestPassedMessage/GetHandleTestPassedMessage.ts'
import * as GetHandleTestRunningMessage from '../GetHandleTestRunningMessage/GetHandleTestRunningMessage.ts'
import * as GetHandleTestSetupMessage from '../GetHandleTestSetupMessage/GetHandleTestSetupMessage.ts'
import * as GetHandleTestSkippedMessage from '../GetHandleTestSkippedMessage/GetHandleTestSkippedMessage.ts'
import * as GetInitializedMessage from '../GetInitializedMessage/GetInitializedMessage.ts'
import * as GetInitializingMessage from '../GetInitializingMessage/GetInitializingMessage.ts'
import * as GetInterruptedMessage from '../GetInterruptedMessage/GetInterruptedMessage.ts'
import * as GetPatternUsageMessage from '../GetPatternUsageMessage/GetPatternUsageMessage.ts'
import * as GetTestClearMessage from '../GetTestClearMessage/GetTestClearMessage.ts'
import * as GetTestsUnexpectedErrorMessage from '../GetTestsUnexpectedErrorMessage/GetTestsUnexpectedErrorMessage.ts'
import * as GetWatchUsageMessage from '../GetWatchUsageMessage/GetWatchUsageMessage.ts'

export const commandMap: Record<string, (...args: readonly any[]) => any> = {
  'Stdout.formatStack': FormatStack.formatStack,
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
  'Stdout.getHandleTestFailedMessage': GetHandleTestFailedMessage.getHandleTestFailedMessage,
  'Stdout.getHandleTestPassedMessage': GetHandleTestPassedMessage.getHandleTestPassedMessage,
  'Stdout.getHandleTestRunningMessage': GetHandleTestRunningMessage.getHandleTestRunningMessage,
  'Stdout.getHandleTestSetupMessage': GetHandleTestSetupMessage.getHandleTestSetupMessage,
  'Stdout.getHandleTestSkippedMessage': GetHandleTestSkippedMessage.getHandleTestSkippedMessage,
  'Stdout.getInitializedMessage': GetInitializedMessage.getInitializedMessage,
  'Stdout.getInitializingMessage': GetInitializingMessage.getInitializingMessage,
  'Stdout.getInterruptedMessage': GetInterruptedMessage.getInterruptedMessage,
  'Stdout.getPatternUsageMessage': GetPatternUsageMessage.getPatternUsageMessage,
  'Stdout.getTestClearMessage': GetTestClearMessage.getTestClearMessage,
  'Stdout.getTestsUnexpectedErrorMessage': GetTestsUnexpectedErrorMessage.getTestsUnexpectedErrorMessage,
  'Stdout.getWatchUsageMessage': GetWatchUsageMessage.getWatchUsageMessage,
}
