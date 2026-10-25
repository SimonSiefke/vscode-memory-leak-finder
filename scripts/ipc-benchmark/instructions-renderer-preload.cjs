const { ipcRenderer } = require('electron')
window.reportBenchmark = (value) => ipcRenderer.send('benchmark-result', value)
window.benchmarkControl = (command) => ipcRenderer.invoke('benchmark-control', command)
ipcRenderer.on('benchmark-start', (event, data) => window.postMessage({ event: 'benchmark-start', ...data }, '*', event.ports))
