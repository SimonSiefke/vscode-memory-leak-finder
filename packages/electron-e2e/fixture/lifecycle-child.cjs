const { isMainThread, parentPort } = require('node:worker_threads')

// Remain alive until the parent explicitly kills or terminates this resource.
setInterval(() => {}, 1000)
if (!isMainThread) parentPort.postMessage('ready')
else if (process.parentPort) process.parentPort.postMessage('ready')
else process.stdout.write('ready\n')
