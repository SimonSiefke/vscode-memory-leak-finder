import { test, expect } from '@playwright/test'

test('webworker event listener count', async ({ page }) => {
  await page.goto('data:text/html,<html><body><h1>WebWorker Test</h1></body></html>')

  // Create a webworker
  await page.evaluate(() => {
    const worker = new Worker(URL.createObjectURL(new Blob([`
      // Worker script
      self.addEventListener('message', function(e) {
        console.log('Worker received:', e.data)
        self.postMessage('Hello from worker!')
      })

      // Add some event listeners in the worker
      self.addEventListener('error', function(e) {
        console.error('Worker error:', e)
      })

      self.addEventListener('unhandledrejection', function(e) {
        console.error('Worker unhandled rejection:', e)
      })
    `], { type: 'application/javascript' })))

    // Store worker in global scope so it doesn't get garbage collected
    window.testWorker = worker

    // Send a message to the worker
    worker.postMessage('test')

    // Add some event listeners in the main thread
    window.addEventListener('load', function() {})
    window.addEventListener('resize', function() {})
    document.addEventListener('click', function() {})
  })

  // Wait a bit for the worker to be created
  await page.waitForTimeout(1000)

  // The test framework will measure event listeners here
  // We just need to make sure the page loads and the worker is created
  const title = await page.title()
  expect(title).toBe('')
})
