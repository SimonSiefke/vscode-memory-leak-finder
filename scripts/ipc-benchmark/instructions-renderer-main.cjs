Buffer.poolSize = 8192
for (let i = 0; i < 256; i++) {
  if (Buffer.allocUnsafe(512).buffer.byteLength === 8192) break
}
const { app, utilityProcess, MessageChannelMain, BrowserWindow, ipcMain } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app
  .whenReady()
  .then(async () => {
    const options = JSON.parse(process.env.IPC_OPT_BENCH_OPTIONS)
    const child = utilityProcess.fork(path.join(__dirname, 'instructions-renderer-worker.cjs'), [], {
      stdio: 'pipe',
      serviceName: 'IPC hardware measurement',
    })
    const ready = new Promise((resolve, reject) => {
      child.once('message', (r) => (r.error ? reject(new Error(r.error)) : resolve(r)))
      child.once('exit', (code) => reject(new Error('Worker exited ' + code)))
    })
    const pair = new MessageChannelMain()
    child.postMessage({ command: 'start', options }, [pair.port2])
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'instructions-renderer-preload.cjs'),
        nodeIntegration: false,
        contextIsolation: false,
        sandbox: false,
        webSecurity: false,
        backgroundThrottling: false,
      },
    })
    const worker = await ready
    const ctl = fs.openSync(process.env.PERF_CONTROL, 'w')
    const ack = fs.openSync(process.env.PERF_ACK, 'r')
    const buffer = Buffer.alloc(5)
    const gate = (command) => {
      fs.writeSync(ctl, command + '\n')
      let length = 0
      while (length < 5) length += fs.readSync(ack, buffer, length, 5 - length, null)
      if (buffer.toString() !== 'ack\n\0') throw new Error('Invalid perf control acknowledgement')
    }
    const workerControl = (command) =>
      new Promise((resolve, reject) => {
        child.once('message', (r) => (r.error ? reject(new Error(r.error)) : resolve(r)))
        child.postMessage({ command })
      })
    ipcMain.handle('benchmark-control', async (_event, command) => {
      if (command === 'enable' || command === 'disable') {
        gate(command)
        return
      }
      if (command === 'stats') return workerControl('stats')
      if (command === 'gc') {
        await workerControl('gc')
        window.webContents.debugger.attach('1.3')
        try {
          await window.webContents.debugger.sendCommand('HeapProfiler.collectGarbage')
        } finally {
          window.webContents.debugger.detach()
        }
        return
      }
      throw new Error('Unknown control command')
    })
    const result = new Promise((resolve, reject) =>
      ipcMain.once('benchmark-result', (_event, r) => (r.error ? reject(new Error(r.error)) : resolve(r))),
    )
    await window.loadFile(path.join(__dirname, 'instructions-renderer.html'))
    window.webContents.postMessage('benchmark-start', { options, identifier: worker.identifier }, [pair.port1])
    const data = await result
    fs.writeFileSync(
      process.env.OUTPUT,
      JSON.stringify(
        {
          ...data,
          options,
          versions: process.versions,
          worker,
          pids: { main: process.pid, worker: child.pid, renderer: window.webContents.getOSProcessId() },
          hardwareCounting:
            'Counts all inherited Electron application processes; excludes startup, warmup and full GC; includes renderer and utility-process RPC work',
        },
        null,
        2,
      ),
    )
    fs.closeSync(ctl)
    fs.closeSync(ack)
    child.kill()
    window.destroy()
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
