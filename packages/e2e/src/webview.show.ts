import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Extensions }: TestContext) => {
  // @ts-ignore
  await Extensions.add(`packages/e2e/fixtures/sample.webview-provider`, 'webview-sample')
}

export const run = async ({ QuickPick, WebView, Editor }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Test: Show WebView')
  await QuickPick.select('Test: Show WebView')
  await WebView.shouldBeVisible2({
    extensionId: 'undefined_publisher.webview-sample',
  })
  await Editor.closeAll()
}
