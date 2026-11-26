const vscode = require('vscode')

const prefix = 'Notebook Controller Execution Interrupt'
const notebookType = 'vmlf-interrupt-notebook'
const barrierTimeout = 60_000

let serializer
let controller
let document
let executionOrder = 0
let cycle
const pending = new Set()

const newCycle = () => ({ completed: 0, executions: 0, interrupted: 0, timedOut: 0 })

const textOutput = (text) => new vscode.NotebookCellOutput([vscode.NotebookCellOutputItem.text(text, 'text/plain')])

// Resolves when the token is cancelled, or with false after barrierTimeout so a lost interrupt cannot hang the run.
const waitForCancellation = (token) =>
  new Promise((resolve) => {
    if (token.isCancellationRequested) {
      resolve(true)
      return
    }
    const timeout = setTimeout(() => {
      listener.dispose()
      resolve(false)
    }, barrierTimeout)
    const listener = token.onCancellationRequested(() => {
      clearTimeout(timeout)
      listener.dispose()
      resolve(true)
    })
  })

const executeCell = async (cell) => {
  const execution = controller.createNotebookCellExecution(cell)
  pending.add(execution)
  const blocked = cycle.executions === 0
  cycle.executions++
  try {
    execution.executionOrder = ++executionOrder
    execution.start(Date.now())
    if (!blocked) {
      await execution.replaceOutput(textOutput('completed'))
      execution.end(true, Date.now())
      cycle.completed++
      return
    }
    await execution.replaceOutput(textOutput('stream: first chunk'))
    const cancelled = await waitForCancellation(execution.token)
    execution.end(false, Date.now())
    if (cancelled) {
      cycle.interrupted++
      void vscode.window.showInformationMessage(`${prefix}: interrupt observed`)
    } else {
      cycle.timedOut++
      void vscode.window.showErrorMessage(`${prefix}: execution was not interrupted`)
    }
  } finally {
    pending.delete(execution)
  }
}

const closeNotebook = async () => {
  if (!document || document.isClosed) {
    document = undefined
    return
  }
  const closing = document
  const closed = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      listener.dispose()
      reject(new Error('Interrupt fixture notebook did not close'))
    }, 10_000)
    const listener = vscode.workspace.onDidCloseNotebookDocument((closedDocument) => {
      if (closedDocument !== closing) return
      clearTimeout(timeout)
      listener.dispose()
      resolve()
    })
  })
  await vscode.window.showNotebookDocument(closing)
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  await closed
  document = undefined
}

const setup = async () => {
  if (controller || serializer) throw new Error('Interrupt fixture is already set up')
  serializer = vscode.workspace.registerNotebookSerializer(
    notebookType,
    {
      deserializeNotebook: () => new vscode.NotebookData([]),
      serializeNotebook: () => new Uint8Array(),
    },
    { transientOutputs: true },
  )
  controller = vscode.notebooks.createNotebookController('vmlf-interrupt-kernel', notebookType, 'Interrupt Fixture Kernel')
  controller.supportedLanguages = ['plaintext']
  controller.supportsExecutionOrder = true
  controller.executeHandler = async (cells) => {
    for (const cell of cells) {
      await executeCell(cell)
    }
  }
  cycle = newCycle()
  document = await vscode.workspace.openNotebookDocument(
    notebookType,
    new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'interrupt fixture cell', 'plaintext')]),
  )
  controller.updateNotebookAffinity(document, vscode.NotebookControllerAffinity.Preferred)
  await vscode.window.showNotebookDocument(document)
}

const reset = () => {
  if (!controller || !document) throw new Error('Interrupt fixture is not set up')
  if (pending.size !== 0) throw new Error(`${pending.size} cell executions are still pending`)
  if (cycle.timedOut !== 0) throw new Error('A cell execution was not interrupted')
  if (cycle.interrupted !== 1 || cycle.completed !== 1)
    throw new Error(`Expected one interrupted and one completed execution, got ${cycle.interrupted} and ${cycle.completed}`)
  const outputs = document.cellAt(0).outputs.length
  if (outputs !== 0) throw new Error(`Expected cleared outputs, found ${outputs}`)
  cycle = newCycle()
}

const cleanup = async () => {
  const stillPending = pending.size
  try {
    await closeNotebook()
  } finally {
    controller?.dispose()
    controller = undefined
    serializer?.dispose()
    serializer = undefined
    cycle = undefined
  }
  if (stillPending !== 0) throw new Error(`${stillPending} cell executions were still pending`)
}

const register = (context, name, fn) => {
  context.subscriptions.push(
    vscode.commands.registerCommand(`notebook-controller-execution-interrupt.${name}`, async () => {
      try {
        await fn()
      } catch (error) {
        void vscode.window.showErrorMessage(`${prefix}: ${name} failed: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
      void vscode.window.showInformationMessage(`${prefix}: ${name} complete`)
    }),
  )
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup().catch(() => {})
    },
  })
  register(context, 'setup', setup)
  register(context, 'reset', reset)
  register(context, 'cleanup', cleanup)
}
