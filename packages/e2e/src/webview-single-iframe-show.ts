import type { TestContext } from '../types.js'

const extensionId = 'vscode-memory-leak-finder.single-iframe-webview'
const useSingleIframeWebview = process.env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER === '1'

export const skip = 1

export const run = async ({ Editor, QuickPick, SingleIframeWebView, WebView }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Test: Show Single-Iframe WebView')
  await QuickPick.select('Test: Show Single-Iframe WebView')
  const webview = useSingleIframeWebview ? SingleIframeWebView : WebView
  await webview.shouldHaveContent({
    extensionId,
    selector: '#single-iframe-webview-status',
    text: 'Webview fixture ready',
  })
  await Editor.closeAll()
}
