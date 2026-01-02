import * as vscode from 'vscode'

export function activate(context) {
  const provider = {
    provideInlineCompletionItems(document, position, inlineCompletionContext, token) {
      const line = document.lineAt(position.line)
      const textBeforeCursor = line.text.substring(0, position.character)

      if (textBeforeCursor.endsWith('a')) {
        return [new vscode.InlineCompletionItem('bcdef', new vscode.Range(position, position))]
      }

      return []
    },
  }

  context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ scheme: 'file' }, provider))
}

export function deactivate() {}
