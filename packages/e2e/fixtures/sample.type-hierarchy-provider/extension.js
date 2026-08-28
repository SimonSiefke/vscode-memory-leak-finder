const vscode = require('vscode')

const createItem = (document, name, line) => {
  const range = document.lineAt(line).range
  return new vscode.TypeHierarchyItem(vscode.SymbolKind.Class, name, '', document.uri, range, range)
}

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.languages.registerTypeHierarchyProvider('plaintext', {
      prepareTypeHierarchy(document) {
        return createItem(document, 'Dog', 2)
      },
      provideTypeHierarchySubtypes(item) {
        const document = vscode.workspace.textDocuments.find((candidate) => candidate.uri.toString() === item.uri.toString())
        return document ? [createItem(document, 'Labrador', 4)] : []
      },
      provideTypeHierarchySupertypes(item) {
        const document = vscode.workspace.textDocuments.find((candidate) => candidate.uri.toString() === item.uri.toString())
        return document ? [createItem(document, 'Animal', 0)] : []
      },
    }),
  )
}
