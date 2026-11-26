const vscode = require('vscode')

const TITLE = 'File System Provider Virtual Document Lifecycle'
const SCHEME = 'vmlf-memfs'
const FILE_PATH = '/virtual-document.txt'
// Keep these in sync with packages/e2e/src/file-system-provider-virtual-document-lifecycle.ts.
const SEED_TEXT = 'memfs seed'
const TYPED_SUFFIX = ' typed'
const EXTERNAL_TEXT = 'memfs external change'
const TIMEOUT = 10_000

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const fileUri = vscode.Uri.from({ scheme: SCHEME, path: FILE_PATH })

let lastMtime = 0
const nextMtime = () => {
  lastMtime = Math.max(Date.now(), lastMtime + 1)
  return lastMtime
}

const totals = { cycles: 0, watchesCreated: 0, watchesDisposed: 0, writes: 0 }

/** @type {undefined | ReturnType<typeof createCycle>} */
let cycle

const createCycle = () => {
  const emitter = new vscode.EventEmitter()
  const files = new Map()
  const state = {
    doubleDisposals: 0,
    emitter,
    files,
    registration: undefined,
    watchesCreated: 0,
    watchesDisposed: 0,
    writes: 0,
    writesAtVerify: -1,
  }
  const getEntry = (uri) => {
    const entry = files.get(uri.path)
    if (!entry) {
      throw vscode.FileSystemError.FileNotFound(uri)
    }
    return entry
  }
  const provider = {
    onDidChangeFile: emitter.event,
    watch() {
      state.watchesCreated++
      totals.watchesCreated++
      let disposed = false
      return new vscode.Disposable(() => {
        if (disposed) {
          state.doubleDisposals++
          return
        }
        disposed = true
        state.watchesDisposed++
        totals.watchesDisposed++
      })
    },
    stat(uri) {
      if (uri.path === '/') {
        return { ctime: 0, mtime: 0, size: 0, type: vscode.FileType.Directory }
      }
      const entry = getEntry(uri)
      return { ctime: entry.ctime, mtime: entry.mtime, size: entry.data.byteLength, type: vscode.FileType.File }
    },
    readDirectory(uri) {
      if (uri.path !== '/') {
        throw vscode.FileSystemError.FileNotADirectory(uri)
      }
      return [...files.keys()].map((path) => [path.slice(1), vscode.FileType.File])
    },
    readFile(uri) {
      return new Uint8Array(getEntry(uri).data)
    },
    writeFile(uri, content, options) {
      const entry = files.get(uri.path)
      if (!entry && !options.create) {
        throw vscode.FileSystemError.FileNotFound(uri)
      }
      if (entry && options.create && !options.overwrite) {
        throw vscode.FileSystemError.FileExists(uri)
      }
      const mtime = nextMtime()
      files.set(uri.path, { ctime: entry ? entry.ctime : mtime, data: new Uint8Array(content), mtime })
      state.writes++
      totals.writes++
      emitter.fire([{ type: entry ? vscode.FileChangeType.Changed : vscode.FileChangeType.Created, uri }])
    },
    createDirectory(uri) {
      throw vscode.FileSystemError.NoPermissions(uri)
    },
    delete(uri) {
      throw vscode.FileSystemError.NoPermissions(uri)
    },
    rename(uri) {
      throw vscode.FileSystemError.NoPermissions(uri)
    },
  }
  const mtime = nextMtime()
  files.set(FILE_PATH, { ctime: mtime, data: encoder.encode(SEED_TEXT), mtime })
  state.registration = vscode.workspace.registerFileSystemProvider(SCHEME, provider, { isCaseSensitive: true })
  return state
}

const isOurUri = (uri) => uri instanceof vscode.Uri && uri.scheme === SCHEME
const getOurTabs = () => vscode.window.tabGroups.all.flatMap((group) => group.tabs).filter((tab) => tab.input && isOurUri(tab.input.uri))
const findDocument = () => vscode.workspace.textDocuments.find((document) => document.uri.toString() === fileUri.toString())

const waitFor = (event, predicate, description) => {
  let cancel = () => {}
  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      listener.dispose()
      reject(new Error(`Timed out waiting for ${description}`))
    }, TIMEOUT)
    const listener = event((value) => {
      if (predicate(value)) {
        cancel()
        resolve(value)
      }
    })
    cancel = () => {
      clearTimeout(timeout)
      listener.dispose()
    }
  })
  return { cancel, promise }
}

const requireCycle = () => {
  if (!cycle) {
    throw new Error('no provider registered; run Open first')
  }
  return cycle
}

const disposeCycle = () => {
  if (!cycle) {
    return undefined
  }
  const state = cycle
  cycle = undefined
  state.registration.dispose()
  state.emitter.dispose()
  return state
}

const closeOurTabsWithRevert = async () => {
  for (const tab of getOurTabs()) {
    await vscode.commands.executeCommand('vscode.open', tab.input.uri, { preview: false, viewColumn: tab.group.viewColumn })
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  }
}

const setup = async () => {
  await closeOurTabsWithRevert()
  disposeCycle()
  return 'setup complete'
}

const open = async () => {
  if (cycle) {
    throw new Error('previous cycle is still registered')
  }
  if (findDocument()) {
    throw new Error(`a ${SCHEME} document from an earlier cycle is still open`)
  }
  cycle = createCycle()
  totals.cycles++
  // workspace.openTextDocument and showTextDocument(uri) keep an extension-host model reference
  // alive for minutes after the editor closes; vscode.open ties the document to the editor alone.
  const opened = waitFor(
    vscode.workspace.onDidOpenTextDocument,
    (document) => document.uri.toString() === fileUri.toString(),
    'the virtual document to open',
  )
  try {
    await vscode.commands.executeCommand('vscode.open', fileUri, { preview: false })
  } catch (error) {
    opened.cancel()
    throw error
  }
  const existing = findDocument()
  if (existing) {
    opened.cancel()
  }
  const document = existing || (await opened.promise)
  if (document.getText() !== SEED_TEXT) {
    throw new Error(`opened document has unexpected text ${JSON.stringify(document.getText())}`)
  }
  return 'open complete'
}

const verifySaved = () => {
  const state = requireCycle()
  const expected = SEED_TEXT + TYPED_SUFFIX
  const actual = decoder.decode(state.files.get(FILE_PATH).data)
  if (state.writes < 1) {
    throw new Error('the provider received no writeFile call')
  }
  if (actual !== expected) {
    throw new Error(`provider stored ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
  }
  const document = findDocument()
  if (!document || document.isDirty) {
    throw new Error('the saved document is missing or still dirty')
  }
  state.writesAtVerify = state.writes
  return `saved bytes verified: ${encoder.encode(expected).byteLength}`
}

const externalChange = async () => {
  const state = requireCycle()
  const document = findDocument()
  if (!document) {
    throw new Error('the virtual document is not open')
  }
  const changed = waitFor(
    vscode.workspace.onDidChangeTextDocument,
    (event) => event.document === document && event.document.getText() === EXTERNAL_TEXT,
    'the editor to reload the external change',
  )
  state.files.set(FILE_PATH, { ...state.files.get(FILE_PATH), data: encoder.encode(EXTERNAL_TEXT), mtime: nextMtime() })
  state.emitter.fire([{ type: vscode.FileChangeType.Changed, uri: fileUri }])
  await changed.promise
  if (document.isDirty) {
    throw new Error('the reloaded document is dirty')
  }
  const dirtyTab = getOurTabs().find((tab) => tab.isDirty)
  if (dirtyTab) {
    throw new Error('the reloaded editor tab is dirty')
  }
  return 'external change applied'
}

const unregister = async () => {
  const state = requireCycle()
  if (getOurTabs().length > 0) {
    throw new Error(`a ${SCHEME} editor tab is still open`)
  }
  if (findDocument()) {
    const closed = waitFor(
      vscode.workspace.onDidCloseTextDocument,
      (document) => document.uri.toString() === fileUri.toString(),
      'the virtual document to close',
    )
    await closed.promise
  }
  if (state.writes !== state.writesAtVerify) {
    throw new Error(`the provider received ${state.writes - state.writesAtVerify} writes after the save`)
  }
  disposeCycle()
  if (state.doubleDisposals > 0) {
    throw new Error(`${state.doubleDisposals} watch subscriptions were disposed twice`)
  }
  if (state.watchesDisposed > state.watchesCreated) {
    throw new Error(`${state.watchesDisposed} watch disposals for ${state.watchesCreated} subscriptions`)
  }
  // Live watches are report-only: the workbench does not promise to unwatch before unregistering.
  return `cycle complete: writes ${state.writes}, watches created ${state.watchesCreated}, disposed ${state.watchesDisposed}, live ${state.watchesCreated - state.watchesDisposed}`
}

const cleanup = async () => {
  await closeOurTabsWithRevert()
  disposeCycle()
  return `cleanup complete: cycles ${totals.cycles}, writes ${totals.writes}, watches created ${totals.watchesCreated}, disposed ${totals.watchesDisposed}`
}

/** @type {undefined | vscode.LogOutputChannel} */
let log

const register = (context, name, callback) => {
  context.subscriptions.push(
    vscode.commands.registerCommand(`file-system-provider-virtual-document-lifecycle.${name}`, async () => {
      try {
        const message = await callback()
        log?.info(`${name}: ${message}`)
        void vscode.window.showInformationMessage(`${TITLE}: ${message}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log?.error(`${name}: ${message}`)
        void vscode.window.showErrorMessage(`${TITLE}: ${message}`)
      }
    }),
  )
}

exports.activate = (context) => {
  log = vscode.window.createOutputChannel(TITLE, { log: true })
  context.subscriptions.push(log)
  context.subscriptions.push({
    dispose: () => {
      disposeCycle()
    },
  })
  register(context, 'setup', setup)
  register(context, 'open', open)
  register(context, 'verifySaved', verifySaved)
  register(context, 'externalChange', externalChange)
  register(context, 'unregister', unregister)
  register(context, 'cleanup', cleanup)
}
