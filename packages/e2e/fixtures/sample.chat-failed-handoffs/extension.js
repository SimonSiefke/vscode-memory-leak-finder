const assert = require('node:assert/strict')
const vscode = require('vscode')
let target
let model
let participant
let inlineRun
let requests = 0
let exits = 0
let produceEdit = false
let panelResponses = 0
let beforePanel = 0
const originalSettings = []

const setup = async () => {
  const configuration = vscode.workspace.getConfiguration()
  for (const [key, value] of Object.entries({
    'chat.defaultToCopilotHarness': false,
    'chat.editor.preferCopilotHarness': false,
    'chat.editor.localAgent.enabled': true,
    'chat.inlineChat.agentHost.enabled': false,
  })) {
    originalSettings.push([key, configuration.inspect(key)?.globalValue])
    await configuration.update(key, value, vscode.ConfigurationTarget.Global)
  }
  const folder = vscode.workspace.workspaceFolders?.[0]
  assert.ok(folder, 'A test workspace is required')
  target = vscode.Uri.joinPath(folder.uri, 'failed-handoff.txt')
  await vscode.workspace.fs.writeFile(target, Buffer.from('original\n'))
  model = vscode.lm.registerLanguageModelChatProvider('handoff-fixture', {
    provideLanguageModelChatInformation: () => [
      {
        id: 'mock-handoff',
        name: 'Mock handoff',
        family: 'handoff-fixture',
        version: '1',
        maxInputTokens: 64000,
        maxOutputTokens: 1024,
        capabilities: { toolCalling: true },
      },
    ],
    async provideLanguageModelChatResponse() {
      throw new Error('Unexpected model request')
    },
    async provideTokenCount() {
      return 1
    },
  })
  participant = vscode.chat.createChatParticipant('chat-failed-handoffs.participant', async (request, _context, stream, token) => {
    requests++
    if (produceEdit) {
      stream.textEdit(target, vscode.TextEdit.replace(new vscode.Range(0, 0, 0, 8), 'modified'))
      stream.textEdit(target, true)
      const result = await vscode.lm.invokeTool(
        'inline_chat_exit',
        {
          input: { response: 'Continue in panel.' },
          toolInvocationToken: request.toolInvocationToken,
        },
        token,
      )
      assert.ok(
        result.content.some((part) => part.value === 'Success'),
        'The real inline exit tool must find the source session',
      )
      exits++
    } else {
      panelResponses++
    }
    stream.markdown('Local handoff response.')
  })
  assert.equal((await vscode.lm.selectChatModels({ vendor: 'handoff-fixture', id: 'mock-handoff' })).length, 1)
}
const start = async () => {
  await vscode.workspace.fs.writeFile(target, Buffer.from('original\n'))
  const doc = await vscode.workspace.openTextDocument(target)
  await vscode.window.showTextDocument(doc, { preview: false })
  produceEdit = true
  const beforeExits = exits
  const before = requests
  inlineRun = vscode.commands.executeCommand('inlineChat.start', {
    message: 'Make the local mock edit.',
    autoSend: true,
    resolveOnResponse: true,
    modelSelector: { vendor: 'handoff-fixture', id: 'mock-handoff' },
  })
  await inlineRun
  assert.ok(requests > before, 'The local participant must receive the inline request')
  const deadline = Date.now() + 5000
  while (exits === beforeExits && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 25))
  assert.equal(exits, beforeExits + 1, 'Inline chat must terminate through the real exit tool before continuation')
}
const handoff = async () => {
  produceEdit = false
  beforePanel = panelResponses
  try {
    await vscode.commands.executeCommand('inlineChat2.continueInChat')
  } catch (error) {
    if (!String(error).includes('HANDOFF_FIXTURE_FAILURE') && !String(error).includes('Canceled')) throw error
  }
}
const verify = async () => {
  assert.equal(panelResponses, beforePanel + 1, 'The local participant must complete the recovery handoff')
}
const cancel = async () => {
  await vscode.commands.executeCommand('inlineChat2.close')
  let timer
  try {
    await Promise.race([
      inlineRun,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Inline cleanup did not settle')), 5000)
      }),
    ])
  } finally {
    clearTimeout(timer)
    inlineRun = undefined
  }
}
const cleanup = async () => {
  try {
    try {
      await cancel()
    } finally {
      participant?.dispose()
      participant = undefined
      model?.dispose()
      model = undefined
      try {
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
        await vscode.commands.executeCommand('workbench.action.closeAllEditors')
      } finally {
        if (target) {
          await vscode.workspace.fs.delete(target)
          target = undefined
        }
      }
    }
  } finally {
    for (const [key, value] of originalSettings.splice(0).reverse()) {
      await vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Global)
    }
  }
}
exports.activate = (context) => {
  context.subscriptions.push({
    dispose() {
      participant?.dispose()
      model?.dispose()
    },
  })
  for (const [name, handler] of Object.entries({ setup, start, handoff, verify, cancel, cleanup })) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`chat-failed-handoffs.${name}`, async () => {
        try {
          await handler()
          void vscode.window.showInformationMessage(`Chat Failed Handoffs: ${name} complete`)
        } catch (error) {
          console.error(`Chat Failed Handoffs: ${name} failed`, error)
          void vscode.window.showErrorMessage(`Chat Failed Handoffs: ${name} failed: ${error}`)
          throw error
        }
      }),
    )
  }
}
