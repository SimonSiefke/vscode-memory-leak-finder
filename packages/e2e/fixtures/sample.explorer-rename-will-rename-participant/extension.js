const vscode = require('vscode')

const PREFIX = 'Explorer Rename Participant'
const SOURCE = 'source.txt'
const TARGET = 'renamed.txt'
const REFERENCES = 'references.txt'
const MARKER_PREFIX = 'vmlf-rename-participant-'

let registration
let seed
let cycle = 0
let events = 0
let eventsAtCleanup
let armed
let held

const getUri = (name) => {
  const folder = vscode.workspace.workspaceFolders?.[0]
  if (!folder) throw new Error('Expected an open workspace folder')
  return vscode.Uri.joinPath(folder.uri, name)
}

const readDisk = async () => {
  return new TextDecoder().decode(await vscode.workspace.fs.readFile(getUri(REFERENCES)))
}

const countOccurrences = (text, value) => text.split(value).length - 1

const createEdit = (marker) => {
  const edit = new vscode.WorkspaceEdit()
  edit.insert(getUri(REFERENCES), new vscode.Position(0, 0), `${marker}\n`)
  return edit
}

const getBaseName = (uri) => uri.path.slice(uri.path.lastIndexOf('/') + 1)

const onWillRenameFiles = (event) => {
  events++
  const current = armed
  armed = undefined
  if (!current) return
  current.events++
  current.files = event.files.map((file) => `${getBaseName(file.oldUri)}->${getBaseName(file.newUri)}`)
  if (current.mode === 'apply') {
    event.waitUntil(Promise.resolve(createEdit(current.marker)))
    return
  }
  // hold: block the participant until the scenario releases it, after the
  // workbench has already timed out and cancelled the participant token.
  const state = current
  state.token = event.token
  state.cancellationListener = event.token.onCancellationRequested(() => {
    state.cancellationObserved = true
    void vscode.window.showInformationMessage(`${PREFIX}: cancellation observed`)
  })
  state.settled = new Promise((resolve) => {
    state.release = resolve
  }).then(() => createEdit(state.marker))
  event.waitUntil(state.settled)
}

const setup = async () => {
  registration?.dispose()
  registration = vscode.workspace.onWillRenameFiles(onWillRenameFiles)
  seed = await readDisk()
  if (seed.includes(MARKER_PREFIX)) throw new Error('Seed already contains a participant marker')
  cycle = 0
  events = 0
  eventsAtCleanup = undefined
  armed = undefined
  held = undefined
  // the workbench reads files.participants.timeout when the rename starts
  const deadline = Date.now() + 5000
  while (vscode.workspace.getConfiguration('files').inspect('participants.timeout')?.workspaceValue === undefined) {
    if (Date.now() > deadline) throw new Error('Workspace files.participants.timeout was not applied')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return `participants timeout ${vscode.workspace.getConfiguration('files').get('participants.timeout')}`
}

const arm = (mode) => {
  if (!registration) throw new Error('Participant is not registered')
  if (armed) throw new Error(`Participant is still armed for ${armed.mode}`)
  if (held && !held.done) throw new Error('A held participant was not released')
  cycle++
  armed = { mode, marker: `${MARKER_PREFIX}${mode}-${cycle}`, events: 0, files: [] }
  return armed
}

let applied
const armApply = () => {
  applied = arm('apply')
}

const assertSingleParticipation = (state) => {
  if (armed) throw new Error(`The ${state.mode} participant was not invoked`)
  if (state.events !== 1) throw new Error(`Expected one ${state.mode} participation, got ${state.events}`)
  if (state.files.length !== 1 || state.files[0] !== `${SOURCE}->${TARGET}`) {
    throw new Error(`Unexpected rename event: ${JSON.stringify(state.files)}`)
  }
}

const verifyApplied = async () => {
  const state = applied
  if (!state) throw new Error('Apply was not armed')
  assertSingleParticipation(state)
  const document = await vscode.workspace.openTextDocument(getUri(REFERENCES))
  const count = countOccurrences(document.getText(), state.marker)
  if (count !== 1) throw new Error(`Expected marker ${state.marker} once, got ${count}`)
  if (countOccurrences(document.getText(), MARKER_PREFIX) !== 1) throw new Error('Unexpected extra participant markers')
  if (!document.isDirty) throw new Error('Participant edit should leave references.txt dirty')
  if ((await readDisk()) !== seed) throw new Error('Participant edit must not be saved to disk')
  await vscode.window.showTextDocument(document)
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  const reverted = await vscode.workspace.openTextDocument(getUri(REFERENCES))
  if (reverted.isDirty || reverted.getText() !== seed) throw new Error('references.txt was not reverted')
  applied = undefined
  return state.marker
}

const armHold = () => {
  held = arm('hold')
  held.done = false
}

const release = async () => {
  const state = held
  if (!state) throw new Error('Hold was not armed')
  assertSingleParticipation(state)
  if (!state.release || !state.settled) throw new Error('Held participant did not call waitUntil')
  if (!state.cancellationObserved || !state.token.isCancellationRequested) {
    throw new Error('Participant token was not cancelled before release')
  }
  state.release()
  const edit = await state.settled
  if (!(edit instanceof vscode.WorkspaceEdit)) throw new Error('Late participant result was not a WorkspaceEdit')
  state.cancellationListener.dispose()
  state.done = true
  // let the extension host observe the settled promise and drop the result
  await new Promise((resolve) => setTimeout(resolve, 100))
  return state.marker
}

const verifyUnchanged = async () => {
  const state = held
  if (!state || !state.done) throw new Error('Hold was not released')
  const dirty = vscode.workspace.textDocuments.filter((document) => document.isDirty).map((document) => getBaseName(document.uri))
  if (dirty.length > 0) throw new Error(`Unexpected dirty documents: ${dirty.join(', ')}`)
  const document = await vscode.workspace.openTextDocument(getUri(REFERENCES))
  if (document.getText() !== seed) throw new Error(`Late marker ${state.marker} was applied`)
  if ((await readDisk()) !== seed) throw new Error('references.txt changed on disk')
  held = undefined
  return state.marker
}

const cleanup = async () => {
  armed = undefined
  if (held && !held.done) {
    held.release?.()
    held.cancellationListener?.dispose()
  }
  held = undefined
  applied = undefined
  registration?.dispose()
  registration = undefined
  eventsAtCleanup = events
}

const verifyDisposed = () => {
  if (registration || eventsAtCleanup === undefined) throw new Error('Cleanup did not run')
  if (events !== eventsAtCleanup) throw new Error(`Disposed participant still received ${events - eventsAtCleanup} rename events`)
}

const register = (context, name, message, callback) => {
  context.subscriptions.push(
    vscode.commands.registerCommand(`explorer-rename-will-rename-participant.${name}`, async () => {
      try {
        const detail = await callback()
        void vscode.window.showInformationMessage(`${PREFIX}: ${message}${detail ? `: ${detail}` : ''}`)
      } catch (error) {
        void vscode.window.showErrorMessage(`${PREFIX}: ${name} failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }),
  )
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  register(context, 'setup', 'setup complete', setup)
  register(context, 'armApply', 'apply armed', armApply)
  register(context, 'verifyApplied', 'apply verified', verifyApplied)
  register(context, 'armHold', 'hold armed', armHold)
  register(context, 'release', 'late completion observed', release)
  register(context, 'verifyUnchanged', 'unchanged verified', verifyUnchanged)
  register(context, 'cleanup', 'cleanup complete', cleanup)
  register(context, 'verifyDisposed', 'disposal verified', verifyDisposed)
}
