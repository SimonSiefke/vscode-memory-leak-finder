import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.ChatProvider = {
    id: 'mock-chat',
    label: 'Mock Chat',
    async provideChatResponse(
      request: vscode.ChatRequest,
      progress: vscode.Progress<vscode.ChatResponse>,
      token: vscode.CancellationToken,
    ): Promise<vscode.ChatResponse> {
      // Simulate a response
      // @ts-ignore
      await new Promise<void>((resolve) => setTimeout(resolve, 100))
      progress.report({ content: `Echo: ${request.prompt}` })
      return { content: `Final Echo: ${request.prompt}` }
    },
  }

  context.subscriptions.push(vscode.chat.registerChatProvider(provider))
}

export function deactivate() {}
