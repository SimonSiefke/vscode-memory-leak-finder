const vscode = require('vscode')

const selector = { pattern: '**/*.outline-fixture', scheme: 'file' }
const symbolLine = /^symbol (\w+)$/

let registration
let requests = 0
let inFlight = 0

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const provideDocumentSymbols = async (document, token) => {
  requests++
  inFlight++
  try {
    // Keep each request pending briefly so disposal can observe unfinished work.
    await delay(10)
    if (token.isCancellationRequested) return []
    const symbols = []
    for (let line = 0; line < document.lineCount; line++) {
      const textLine = document.lineAt(line)
      const match = symbolLine.exec(textLine.text)
      if (!match) continue
      const nameStart = textLine.text.indexOf(match[1])
      const nameRange = new vscode.Range(line, nameStart, line, nameStart + match[1].length)
      symbols.push(new vscode.DocumentSymbol(match[1], '', vscode.SymbolKind.Function, textLine.range, nameRange))
    }
    return symbols
  } finally {
    inFlight--
  }
}

const waitForIdleProvider = async () => {
  for (let attempt = 0; attempt < 100 && inFlight > 0; attempt++) await delay(50)
  if (inFlight !== 0) throw new Error(`${inFlight} document symbol requests are still in flight`)
}

const register = () => {
  if (registration) throw new Error('Document symbol provider is already registered')
  requests = 0
  registration = vscode.languages.registerDocumentSymbolProvider(selector, { provideDocumentSymbols })
}

const dispose = async () => {
  if (!registration) throw new Error('Document symbol provider is not registered')
  registration.dispose()
  registration = undefined
  await waitForIdleProvider()
  if (requests === 0) throw new Error('Document symbol provider was never queried')
  return requests
}

const cleanup = async () => {
  registration?.dispose()
  registration = undefined
  await waitForIdleProvider()
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      registration?.dispose()
      registration = undefined
    },
  })
  context.subscriptions.push(
    vscode.commands.registerCommand('outline-view-symbol-provider-churn.register', async () => {
      register()
      void vscode.window.showInformationMessage('Outline View Symbol Provider Churn: provider registered')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('outline-view-symbol-provider-churn.dispose', async () => {
      const count = await dispose()
      void vscode.window.showInformationMessage(`Outline View Symbol Provider Churn: provider disposed after ${count} requests`)
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('outline-view-symbol-provider-churn.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Outline View Symbol Provider Churn: cleanup complete')
    }),
  )
}
