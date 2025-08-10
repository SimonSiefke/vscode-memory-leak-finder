export const waitForApplicationToBeReadyInternal = async ({ page }) => {
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

export const waitForApplicationToBeReady = async ({ page, expect, VError }) => {
  return await waitForApplicationToBeReadyInternal({
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
