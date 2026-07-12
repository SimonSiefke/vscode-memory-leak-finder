const vscode = acquireVsCodeApi()
const image = document.getElementById('fixture-image')
const status = document.getElementById('single-iframe-webview-status')
let imageLoaded = image.complete && image.naturalWidth > 0
let readySent = false

const update = () => {
  const styleLoaded = getComputedStyle(document.body).paddingTop === '24px'
  if (imageLoaded && styleLoaded && !readySent) {
    readySent = true
    vscode.postMessage({ type: 'ready' })
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
  if (event.data?.type === 'ping') {
    vscode.postMessage({ type: 'complete' })
  }
  if (event.data?.type === 'measurement') {
    status.dataset.loadTimeMs = String(event.data.durationMs)
    status.textContent = 'Webview fixture ready'
  }
})

update()
