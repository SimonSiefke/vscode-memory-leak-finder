export const waitForIdle = async (page) => {
  await page.evaluate({
    expression: `await new Promise(resolve => {
  requestIdleCallback(resolve)
})`,
    awaitPromise: true,
    replMode: true,
  })
}
