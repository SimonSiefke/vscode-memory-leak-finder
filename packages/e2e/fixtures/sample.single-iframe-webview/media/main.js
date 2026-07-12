const vscode = acquireVsCodeApi()
const image = document.getElementById('fixture-image')
const status = document.getElementById('single-iframe-webview-status')
let imageLoaded = image.complete && image.naturalWidth > 0
let messageReceived = false

const update = () => {
  const styleLoaded = getComputedStyle(document.body).paddingTop === '24px'
  if (imageLoaded && messageReceived && styleLoaded) {
    status.textContent = 'Webview fixture ready'
  }
}

image.addEventListener('load', () => {
  imageLoaded = true
  update()
})
image.addEventListener('error', () => {
  status.textContent = 'Fixture image failed to load'
})
window.addEventListener('message', (event) => {
  if (event.data?.type === 'pong') {
    messageReceived = true
    update()
  }
})

vscode.postMessage({ type: 'ready' })
update()
