export const waitForIdle = async (page) => {
  try {
    await page.evaluate({
      expression: `await new Promise(resolve => {
  requestIdleCallback(resolve)
})`,
      awaitPromise: true,
      replMode: true,
    })
  } catch (error) {
    // @ts-ignore
    error.message = `Failed to verify that page is idle: ` + error.message
    throw error
  }
}
