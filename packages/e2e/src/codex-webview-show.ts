import type { TestContext } from '../types.js'

const extensionId = 'openai.chatgpt'
const useSingleIframeWebview = process.env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER === '1'

export const skip = 1

export const run = async ({ Editor, QuickPick, SingleIframeWebView, WebView }: TestContext): Promise<void> => {
  console.log('CODEX_BENCHMARK_PHASE=warmup')
  await Editor.warmUpTextEditor()
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
}
