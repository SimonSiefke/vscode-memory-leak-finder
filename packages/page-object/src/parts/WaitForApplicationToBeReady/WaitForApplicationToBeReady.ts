const isDevtoolsCannotFindContextError = (error) => {
  return (
    error.name === 'DevtoolsProtocolError' &&
    (error.message === 'Cannot find context with specified id' || error.message === 'uniqueContextId not found')
  )
}

export const waitForApplicationToBeReady = async ({ page, expect, VError }): Promise<void> => {
  try {
    const main = page.locator('[role="main"]')
    await expect(main).toBeVisible({
      timeout: 30_000,
    })
  } catch (error) {
    if (isDevtoolsCannotFindContextError(error)) {
      // ignore and try again
      const main = page.locator('[role="main"]')
      await expect(main).toBeVisible({
        timeout: 30_000,
      })
      return page
    } else {
      throw error
    }
  }
  const notification = page.locator('text=All installed extensions are temporarily disabled.')
  await expect(notification).toBeVisible({
    timeout: 15_000,
  })
}
