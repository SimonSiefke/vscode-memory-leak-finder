const { ipcRenderer } = require('electron')
ipcRenderer.on('benchmark-start', (event, data) => window.postMessage({ event: 'benchmark-start', ...data }, '*', event.ports))
window.reportBenchmark = (result) => ipcRenderer.send('benchmark-result', result)
