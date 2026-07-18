import { access } from 'node:fs/promises'
import type { TestContext } from '../types.js'

const extensionId = 'vscode-memory-leak-finder.single-iframe-webview'
const useSingleIframeWebview = process.env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER === '1'

export const skip = 1

const markMemoryPointAndWaitForMeasurement = async (marker: string, point: string): Promise<void> => {
  if (process.env.VSCODE_MEMORY_LEAK_FINDER_MEASURE_WEBVIEW_MEMORY !== '1') {
    return
  }
  const continuePath = process.env.VSCODE_MEMORY_LEAK_FINDER_MEMORY_CONTINUE_PATH
  if (!continuePath) {
    throw new Error('VSCODE_MEMORY_LEAK_FINDER_MEMORY_CONTINUE_PATH is required for memory measurement')
  }
  console.log(marker)
  const resultPath = `${continuePath}-${point}`
  for (let attempt = 0; attempt < 1200; attempt++) {
    try {
      await access(resultPath)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
  throw new Error(`Timed out waiting for memory measurement: ${point}`)
}

export const run = async ({ Editor, QuickPick, SingleIframeWebView, WebView }: TestContext): Promise<void> => {
  if (process.env.VSCODE_MEMORY_LEAK_FINDER_MEASURE_WEBVIEW_MEMORY !== '1') {
    await Editor.open('webview-benchmark-warmup.txt')
    await Editor.close()
  }
  await QuickPick.showCommands()
  await QuickPick.type('Test: Show Single-Iframe WebView')
  await markMemoryPointAndWaitForMeasurement('WEBVIEW_MEMORY_BASELINE_READY=1', 'baseline')
  const selectedAt = await QuickPick.select('Test: Show Single-Iframe WebView')
  const webview = useSingleIframeWebview ? SingleIframeWebView : WebView
  const result = await webview.shouldHaveContent({
    extensionId,
    selector: '#single-iframe-webview-status',
    text: 'Webview fixture ready',
  })
  const durationMs = Number.parseFloat(result.loadTimeMs)
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`Invalid webview load time: ${result.loadTimeMs}`)
  }
  const endToEndDurationMs = result.readyAt - selectedAt
  if (!Number.isFinite(endToEndDurationMs) || endToEndDurationMs <= 0) {
    throw new Error(`Invalid click-to-ready time: ${endToEndDurationMs}`)
  }
  console.log(`WEBVIEW_INTERNAL_LOAD_TIME_MS=${durationMs}`)
  console.log(`WEBVIEW_UI_LOAD_TIME_MS=${endToEndDurationMs}`)
  await markMemoryPointAndWaitForMeasurement('WEBVIEW_MEMORY_READY=1', 'webview')
  await Editor.closeAll()
}
