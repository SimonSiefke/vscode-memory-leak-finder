import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Extensions }: TestContext) => {
  // @ts-ignore
  await Extensions.add({ expectedName: 'webview-sample', path: `packages/e2e/fixtures/sample.webview-provider` })
}

export const run = async ({ Editor, QuickPick, WebView }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Test: Show WebView')
  await QuickPick.select('Test: Show WebView')
  await WebView.shouldBeVisible2({
    extensionId: 'undefined_publisher.webview-sample',
  })
  await Editor.closeAll()
}
