const vscode = require('vscode')

const { createHash } = require('node:crypto')
let serializer
let model
let document
let responseText
let completed
let closeCommand
const setup = async () => {
  serializer = vscode.workspace.registerNotebookSerializer('linkifier-lifecycle', {
    deserializeNotebook: () => new vscode.NotebookData([]),
    serializeNotebook: () => new Uint8Array(),
  })
  model = vscode.lm.registerLanguageModelChatProvider('lifecycle-local', {
    provideLanguageModelChatInformation: () => [
      {
        id: 'lifecycle-local-model',
        name: 'Lifecycle Local Model',
        family: 'lifecycle-local',
        version: '1',
        maxInputTokens: 64000,
        maxOutputTokens: 1024,
        capabilities: { toolCalling: true },
      },
    ],
    async provideLanguageModelChatResponse(_model, _messages, _options, progress) {
      progress.report(new vscode.LanguageModelTextPart(responseText))
      completed?.()
    },
    async provideTokenCount() {
      return 1
    },
  })
  closeCommand = vscode.commands.registerCommand('notebook-linkifier-repeat-and-close.close', async () => {
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
    document = undefined
    await vscode.commands.executeCommand('workbench.action.chat.newChat')
    void vscode.window.showInformationMessage('Linkifier notebook closed')
  })
  const deadline = Date.now() + 5000
  while (!vscode.extensions.getExtension('GitHub.copilot-chat') && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 50))
  const copilot = vscode.extensions.getExtension('GitHub.copilot-chat')
  if (!copilot) throw new Error('Copilot chat is required to exercise NotebookCellLinkifier')
  await copilot.activate()
}
const run = async () => {
  document = await vscode.workspace.openNotebookDocument(
    'linkifier-lifecycle',
    new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'print(42)', 'python')]),
  )
  await vscode.window.showNotebookDocument(document)
  const cellId = '#VSC-' + createHash('sha1').update(document.cellAt(0).document.uri.toString()).digest('hex').slice(0, 8)
  responseText = `Cell Id ${cellId}. Cell Id ${cellId}.`
  let timeout
  const response = new Promise((resolve, reject) => {
    completed = resolve
    timeout = setTimeout(() => reject(new Error('Copilot did not request the deterministic local model')), 10000)
  })
  try {
    await vscode.commands.executeCommand('workbench.action.chat.open', {
      query: 'Repeat the notebook cell identifiers supplied by the model without making tool calls.',
      mode: 'ask',
      modelSelector: { vendor: 'lifecycle-local', id: 'lifecycle-local-model' },
    })
    await response
  } finally {
    clearTimeout(timeout)
    completed = undefined
  }
}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  closeCommand?.dispose()
  closeCommand = undefined
  model?.dispose()
  model = undefined
  serializer?.dispose()
  serializer = undefined
  document = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('notebook-linkifier-repeat-and-close.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-linkifier-repeat-and-close.setup', async () => {
      try {
        await setup()
      } catch (error) {
        void vscode.window.showInformationMessage(String(error))
        throw error
      }
      void vscode.window.showInformationMessage('Notebook Linkifier Repeat And Close: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-linkifier-repeat-and-close.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Notebook Linkifier Repeat And Close: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-linkifier-repeat-and-close.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Notebook Linkifier Repeat And Close: cleanup complete')
    }),
  )
}
