Buffer.poolSize = 8192
for (let i = 0; i < 256; i++) {
  if (Buffer.allocUnsafe(512).buffer.byteLength === 8192) break
}
const { app, utilityProcess, MessageChannelMain, BrowserWindow, ipcMain } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const dir = __dirname
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app
  .whenReady()
  .then(async () => {
    const options = JSON.parse(process.env.IPC_OPT_BENCH_OPTIONS)
    const child = utilityProcess.fork(path.join(dir, 'paired-renderer-worker.cjs'), [], {
      stdio: 'pipe',
      serviceName: 'IPC paired comparison',
    })
    const pairs = Object.keys(options.modules).map(() => new MessageChannelMain())
    const ready = new Promise((resolve, reject) => {
      child.once('message', (r) => (r.error ? reject(new Error(r.error)) : resolve(r)))
      child.once('exit', (code) => reject(new Error('Worker exited ' + code)))
    })
    child.postMessage(
      options,
      pairs.map((p) => p.port2),
    )
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.join(dir, 'rpc-renderer-preload.cjs'),
        nodeIntegration: false,
        contextIsolation: false,
        sandbox: false,
        webSecurity: false,
        backgroundThrottling: false,
      },
    })
    const result = new Promise((resolve, reject) =>
      ipcMain.once('benchmark-result', (_event, r) => (r.error ? reject(new Error(r.error)) : resolve(r))),
    )
    await window.loadFile(path.join(dir, 'paired-renderer.html'))
    const worker = await ready
    window.webContents.postMessage(
      'benchmark-start',
      options,
      pairs.map((p) => p.port1),
    )
    const data = await result
    fs.writeFileSync(process.env.OUTPUT, JSON.stringify({ ...data, versions: process.versions, worker }, null, 2))
    child.kill()
    window.destroy()
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
