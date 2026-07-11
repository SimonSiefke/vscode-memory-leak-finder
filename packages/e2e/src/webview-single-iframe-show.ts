import type { TestContext } from '../types.js'

const extensionId = 'vscode-memory-leak-finder.single-iframe-webview'

export const run = async ({ Editor, QuickPick, SingleIframeWebView }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Test: Show Single-Iframe WebView')
  await QuickPick.select('Test: Show Single-Iframe WebView')
  await SingleIframeWebView.shouldHaveContent({
    extensionId,
    selector: '#single-iframe-webview-status',
    text: 'Single iframe webview ready',
  })
  await Editor.closeAll()
}
