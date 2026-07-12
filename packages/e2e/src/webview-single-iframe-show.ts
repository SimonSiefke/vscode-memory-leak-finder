import type { TestContext } from '../types.js'

const extensionId = 'vscode-memory-leak-finder.single-iframe-webview'
const useSingleIframeWebview = process.env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER === '1'

export const skip = 1

export const run = async ({ Editor, QuickPick, SingleIframeWebView, WebView }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Test: Show Single-Iframe WebView')
  await QuickPick.select('Test: Show Single-Iframe WebView')
  const webview = useSingleIframeWebview ? SingleIframeWebView : WebView
  const duration = await webview.shouldHaveContent({
    extensionId,
    selector: '#single-iframe-webview-status',
    text: 'Webview fixture ready',
  })
  const durationMs = Number.parseFloat(duration)
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`Invalid webview load time: ${duration}`)
  }
  console.log(`WEBVIEW_LOAD_TIME_MS=${durationMs}`)
  await Editor.closeAll()
}
