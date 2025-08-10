import * as WaitForApplicationToBeReady from '../WaitForApplicationToBeReady/WaitForApplicationToBeReady.ts'

export const waitForVsCodeToBeReady = async ({ electronApp, isHeadless, isFirstConnection, expect, pageEventState, pageEventType, timeoutConstants, isDevtoolsCannotFindContextError }) => {
  return await WaitForApplicationToBeReady.waitForApplicationToBeReady({
    electronApp,
    isHeadless,
    isFirstConnection,
    expect,
    selectors: {
      mainContent: '[role="main"]',
      readyNotification: 'text=All installed extensions are temporarily disabled.',
    },
    eventHandlers: {
      waitForEvent: pageEventState?.waitForEvent,
      eventTypes: {
        interactiveTime: pageEventType?.InteractiveTime || 'InteractiveTime',
        networkIdle: pageEventType?.NetworkIdle || 'networkIdle',
      },
      timeoutConstants: {
        interactiveTime: timeoutConstants?.InteractiveTime || 20_000,
      },
    },
    errorHandlers: {
      isRetryableError: isDevtoolsCannotFindContextError,
    },
  })
}
