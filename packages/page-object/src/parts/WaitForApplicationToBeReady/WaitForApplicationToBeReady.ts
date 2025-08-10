import { VError } from '../VError/VError.ts'

export interface WaitForApplicationToBeReadyOptions {
  electronApp: {
    firstWindow: () => Promise<any>
  }
  isHeadless: boolean
  isFirstConnection: boolean
  expect: any
  selectors: {
    mainContent: string
    readyNotification?: string
  }
  eventHandlers?: {
    waitForEvent?: (options: { frameId: string; name: string; timeout: number }) => Promise<void>
    eventTypes?: {
      interactiveTime: string
      networkIdle: string
    }
    timeoutConstants?: {
      interactiveTime: number
    }
  }
  errorHandlers?: {
    isRetryableError?: (error: any) => boolean
  }
}

export const waitForApplicationToBeReady = async (options: WaitForApplicationToBeReadyOptions) => {
  const {
    electronApp,
    isHeadless,
    isFirstConnection,
    expect,
    selectors,
    eventHandlers,
    errorHandlers,
  } = options

  const firstWindow = await electronApp.firstWindow()

  if (isFirstConnection && eventHandlers?.waitForEvent) {
    const eventName = isHeadless
      ? eventHandlers.eventTypes?.networkIdle || 'networkIdle'
      : eventHandlers.eventTypes?.interactiveTime || 'InteractiveTime'

    const timeout = eventHandlers.timeoutConstants?.interactiveTime || 20_000

    await eventHandlers.waitForEvent({
      frameId: firstWindow.targetId,
      name: eventName,
      timeout,
    })
  }

  try {
    const main = firstWindow.locator(selectors.mainContent)
    await expect(main).toBeVisible({
      timeout: 30_000,
    })
  } catch (error) {
    if (errorHandlers?.isRetryableError?.(error)) {
      // ignore and try again
      const main = firstWindow.locator(selectors.mainContent)
      await expect(main).toBeVisible({
        timeout: 30_000,
      })
      return firstWindow
    } else {
      throw error
    }
  }

  if (selectors.readyNotification) {
    const notification = firstWindow.locator(selectors.readyNotification)
    await expect(notification).toBeVisible({
      timeout: 15_000,
    })
  }

  return firstWindow
}
