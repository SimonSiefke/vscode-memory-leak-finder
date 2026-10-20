const { app, BrowserWindow, WebContentsView, webContents, utilityProcess } = require('electron')
const { spawn } = require('node:child_process')
const { Worker } = require('node:worker_threads')
const { join } = require('node:path')

// Keep the main process alive between cycles, including with zero windows.
app.on('window-all-closed', () => {})
app.setPath('userData', process.env.ELECTRON_E2E_USER_DATA)

const settle = () => new Promise((resolve) => setTimeout(resolve, 100))
const retainedFunctions = []

const childPath = join(__dirname, 'lifecycle-child.cjs')
let viewHost

const waitForEvent = (emitter, event) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error(`Timed out waiting for ${event}`)), 15_000)
    const finish = (error, args) => {
      clearTimeout(timer)
      emitter.off(event, onEvent)
      emitter.off('error', onError)
      if (error) reject(error)
      else resolve(args)
    }
    const onEvent = (...args) => finish(undefined, args)
    const onError = (error) => finish(error)
    emitter.once(event, onEvent)
    emitter.once('error', onError)
  })
}

const closeWindow = async (window) => {
  if (window.isDestroyed()) return
  const closed = waitForEvent(window, 'closed')
  window.close()
  await closed
  await settle()
}

const verifyWebContentsCount = (expected) => {
  const actual = webContents.getAllWebContents().length
  if (actual !== expected) throw new Error(`Expected ${expected} webContents, found ${actual}`)
}

globalThis.electronE2E = {
  ready: app.whenReady().then(() => true),
  ...require('./api-lifecycles.cjs')({ settle, waitForEvent, closeWindow, verifyWebContentsCount }),
  async windowOpenClose() {
    const window = new BrowserWindow({ width: 400, height: 300, show: true })
    try {
      await window.loadURL('data:text/html,<h1>Electron memory test</h1>')
      const closed = new Promise((resolve) => window.once('closed', resolve))
      window.close()
      await closed
      // Destruction of webContents can finish after the window's closed event.
      await settle()
      if (BrowserWindow.getAllWindows().length || webContents.getAllWebContents().length) {
        throw new Error('Window or webContents survived closing the window')
      }
    } finally {
      if (!window.isDestroyed()) window.destroy()
    }
  },
  async setupViewHost() {
    viewHost = new BrowserWindow({ width: 400, height: 300 })
    await viewHost.loadURL('data:text/html,<h1>WebContentsView host</h1>')
    verifyWebContentsCount(1)
  },
  async teardownViewHost() {
    await closeWindow(viewHost)
    viewHost = undefined
    verifyWebContentsCount(0)
  },
  async webContentsViewAddRemove() {
    const view = new WebContentsView()
    const contents = view.webContents
    try {
      viewHost.contentView.addChildView(view)
      view.setBounds({ x: 0, y: 0, width: 200, height: 150 })
      await contents.loadURL('data:text/html,<h1>Child view</h1>')
      viewHost.contentView.removeChildView(view)
      // Removing a view does not destroy its webContents. Close it explicitly.
      const destroyed = waitForEvent(contents, 'destroyed')
      contents.close()
      await destroyed
      await settle()
      if (viewHost.contentView.children.includes(view)) throw new Error('View remained attached')
      verifyWebContentsCount(1)
    } finally {
      if (!contents.isDestroyed()) contents.close()
    }
  },
  async utilityProcessCreateKill() {
    const child = utilityProcess.fork(childPath, [], { stdio: 'ignore' })
    try {
      const [message] = await waitForEvent(child, 'message')
      if (message !== 'ready' || !child.pid) throw new Error('Utility process did not become ready')
      const exited = waitForEvent(child, 'exit')
      if (!child.kill()) throw new Error('Utility process kill failed')
      await exited
      if (child.pid !== undefined) throw new Error('Utility process still has a PID after exit')
      await settle()
    } finally {
      if (child.pid) child.kill()
    }
  },
  async nodeProcessCreateKill() {
    const child = spawn(process.env.ELECTRON_E2E_NODE_PATH, [childPath], {
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, NODE_OPTIONS: '' },
    })
    try {
      const [data] = await waitForEvent(child.stdout, 'data')
      if (data.toString() !== 'ready\n') throw new Error('Node process did not become ready')
      const closed = waitForEvent(child, 'close')
      if (!child.kill()) throw new Error('Node process kill failed')
      await closed
      if (!child.signalCode && child.exitCode === null) throw new Error('Node process did not exit')
      await settle()
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }
  },
  async workerThreadCreateTerminate() {
    const worker = new Worker(childPath)
    try {
      const [message] = await waitForEvent(worker, 'message')
      if (message !== 'ready') throw new Error('Worker did not become ready')
      await worker.terminate()
      if (worker.threadId !== -1) throw new Error('Worker thread survived termination')
      await settle()
    } finally {
      if (worker.threadId !== -1) await worker.terminate()
    }
  },
  async offscreenRenderClose() {
    const window = new BrowserWindow({ width: 320, height: 240, show: false, webPreferences: { offscreen: true } })
    try {
      const painted = waitForEvent(window.webContents, 'paint')
      const [, args] = await Promise.all([
        window.loadURL('data:text/html,<body style="background:royalblue"><h1>Offscreen frame</h1></body>'),
        painted,
      ])
      const image = args[2]
      if (image.isEmpty()) throw new Error('Offscreen rendering produced an empty image')
      window.webContents.stopPainting()
      if (window.webContents.isPainting()) throw new Error('Offscreen painting did not stop')
      await closeWindow(window)
      verifyWebContentsCount(0)
    } finally {
      if (!window.isDestroyed()) window.destroy()
    }
  },
  // Positive control: validate that main-process measurements detect growth.
  async retainFunction() {
    retainedFunctions.push(function electronE2ERetainedFunction() {})
  },
}
