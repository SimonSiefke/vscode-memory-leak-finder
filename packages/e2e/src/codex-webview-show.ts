import type { TestContext } from '../types.js'

const extensionId = 'openai.chatgpt'
const useSingleIframeWebview = process.env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER === '1'

export const skip = 1

export const setup = async ({ Editor, Extensions, SideBar, Workspace }: TestContext) => {
  // if (!process.env.VSCODE_CODEX_EXTENSION_PATH) {
  //   return
  // }
  console.log('CODEX_BENCHMARK_PHASE=warmup')
await Workspace.setFiles([
    {
      content: 'test',
      name: 'webview-benchmark-warmup.txt',
    },
  ])
    await Editor.closeAll()
  await SideBar.hide()
  // @ts-ignore
  await SideBar.hideSecondary()

  await Extensions.install({
    id: 'openai.chatgpt',
    name: 'Codex – OpenAI’s coding agent',
  })
  await Editor.warmUpTextEditor()
}

export const run = async ({ Editor, QuickPick, SingleIframeWebView, WebView, SideBar }: TestContext): Promise<void> => {
  // if (!process.env.VSCODE_CODEX_EXTENSION_PATH) {
  //   return
  // }
  await QuickPick.waitForCommand('Codex: Open Codex Sidebar')
  console.log('CODEX_BENCHMARK_PHASE=quickpick')
  await QuickPick.showCommands()
  await QuickPick.type('Open Codex Sidebar')
  const selectedAt = await QuickPick.select('Codex: Open Codex Sidebar', false, true)
  console.log('CODEX_BENCHMARK_PHASE=webview')
  const webview = useSingleIframeWebview ? SingleIframeWebView : WebView
  const result = await webview.shouldHaveLoaded({ extensionId })
  const durationMs = result.readyAt - selectedAt
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`Invalid Codex webview load time: ${durationMs}`)
  }
  console.log('CODEX_BENCHMARK_PHASE=ready')
  console.log(`CODEX_WEBVIEW_LOAD_TIME_MS=${durationMs}`)
  await Editor.closeAll()
  await SideBar.hideSecondary()
}
