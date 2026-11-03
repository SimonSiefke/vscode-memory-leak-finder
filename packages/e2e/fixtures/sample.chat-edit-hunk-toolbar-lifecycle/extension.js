const assert = require('node:assert/strict')
const vscode = require('vscode')

const hunkCount = 24
const originalLines = Array.from({ length: hunkCount * 8 }, (_, index) => `original line ${index + 1}`)
let target
let participant
let model

const setup = async () => {
  const folder = vscode.workspace.workspaceFolders?.[0]
  assert.ok(folder, 'A test workspace is required')
  target = vscode.Uri.joinPath(folder.uri, 'chat-edit-hunks.txt')
  await vscode.workspace.fs.writeFile(target, Buffer.from(originalLines.join('\n')))
  // Chat requires a selected model even though this participant produces edits itself.
  model = vscode.lm.registerLanguageModelChatProvider('hunk-fixture', {
    provideLanguageModelChatInformation: () => [
      {
        id: 'mock-hunks',
        name: 'Mock hunk model',
        family: 'hunk-fixture',
        version: '1',
        maxInputTokens: 64000,
        maxOutputTokens: 1024,
        capabilities: { toolCalling: true },
      },
    ],
    async provideLanguageModelChatResponse() {
      throw new Error('The mock participant must not make model requests')
    },
    async provideTokenCount() {
      return 1
    },
  })
  participant = vscode.chat.createChatParticipant('chat-edit-hunk-toolbar-lifecycle.participant', async (_request, _context, stream) => {
    const edits = Array.from({ length: hunkCount }, (_, index) => {
      const line = index * 8 + 2
      return vscode.TextEdit.replace(new vscode.Range(line, 0, line, originalLines[line].length), `mock change ${index + 1}`)
    })
    stream.textEdit(target, edits)
    stream.textEdit(target, true)
    stream.markdown('Created 24 separated mock edits.')
  })
  const models = await vscode.lm.selectChatModels({ vendor: 'hunk-fixture', id: 'mock-hunks' })
  assert.equal(models.length, 1, 'The local mock model must be available before submitting chat edits')
}

const start = async () => {
  const document = await vscode.workspace.openTextDocument(target)
  const reset = new vscode.WorkspaceEdit()
  reset.replace(target, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), originalLines.join('\n'))
  assert.ok(await vscode.workspace.applyEdit(reset), 'The fixture document must be reset before each chat')
  await document.save()
  await vscode.window.showTextDocument(document, { preview: false, selection: new vscode.Range(0, 0, 0, 0) })
  await vscode.commands.executeCommand('workbench.action.chat.open', {
    query: '@hunkfixture Create the mock edits.',
    mode: 'edit',
    modelSelector: { vendor: 'hunk-fixture', id: 'mock-hunks' },
    blockOnResponse: true,
  })
}

const verify = async () => {
  const document = await vscode.workspace.openTextDocument(target)
  const expected = originalLines.map((line, index) => {
    // The first hunk was kept, the second undone, and all others remain pending.
    return index % 8 === 2 && index !== 10 ? `mock change ${Math.floor(index / 8) + 1}` : line
  })
  assert.equal(document.getText(), expected.join('\n'), 'Keep and Undo must resolve the requested hunks without changing other lines')
}

const finish = async () => {
  await vscode.window.showTextDocument(target)
  await vscode.commands.executeCommand('chatEditor.action.acceptAllEdits')
  await verify()
  const document = await vscode.workspace.openTextDocument(target)
  await document.save()
}

const cleanup = async () => {
  participant?.dispose()
  participant = undefined
  model?.dispose()
  model = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  if (target) {
    await vscode.workspace.fs.delete(target)
    target = undefined
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      participant?.dispose()
      model?.dispose()
    },
  })
  for (const [name, handler] of Object.entries({ setup, start, verify, finish, cleanup })) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`chat-edit-hunk-toolbar-lifecycle.${name}`, async () => {
        try {
          await handler()
          void vscode.window.showInformationMessage(`Chat Edit Hunk Toolbar Lifecycle: ${name} complete`)
        } catch (error) {
          void vscode.window.showErrorMessage(`Chat Edit Hunk Toolbar Lifecycle: ${name} failed: ${error}`)
          throw error
        }
      }),
    )
  }
}
