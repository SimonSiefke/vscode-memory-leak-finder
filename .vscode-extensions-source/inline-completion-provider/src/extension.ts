import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext): void {
  const provider: vscode.InlineCompletionItemProvider = {
    provideInlineCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      context: vscode.InlineCompletionContext,
      token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
      const line = document.lineAt(position.line)
      const textBeforeCursor = line.text.substring(0, position.character)

      if (textBeforeCursor.endsWith('a')) {
        return [
          new vscode.InlineCompletionItem('bcdef', new vscode.Range(position, position)),
        ]
      }

      return []
    },
  }

  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider({ scheme: 'file' }, provider),
  )
}

export function deactivate(): void {}

