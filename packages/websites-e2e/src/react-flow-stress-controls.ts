import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://example-apps.xyflow.com/react/examples/nodes/stress/index.html'
const urlPattern = /^https:\/\/example-apps\.xyflow\.com\/react\/examples\/nodes\/stress\/index\.html$/

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 20000) {
    if (document.querySelectorAll('.react-flow__node').length === 450 && document.querySelector('button[aria-label="Fit View"]')) {
      return
    }
    await delay(100)
  }
  throw new Error(\`Timed out waiting for 450 React Flow nodes. url=\${location.href}; nodes=\${document.querySelectorAll('.react-flow__node').length}\`)
})()`

const runExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getButton = (label) => document.querySelector(\`button[aria-label="\${label}"]\`)
  const viewport = document.querySelector('.react-flow__viewport')
  const firstNode = document.querySelector('.react-flow__node')
  const zoomIn = getButton('Zoom In')
  const fitView = getButton('Fit View')
  const toggle = getButton('Toggle Interactivity')
  if (!(viewport instanceof HTMLElement) || !(firstNode instanceof HTMLElement) || !(zoomIn instanceof HTMLElement) || !(fitView instanceof HTMLElement) || !(toggle instanceof HTMLElement)) {
    throw new Error(\`Expected React Flow stress controls. url=\${location.href}\`)
  }
  const initialTransform = viewport.style.transform
  const initialNodeClass = firstNode.className
  const waitFor = async (callback, message) => {
    const start = Date.now()
    while (Date.now() - start < 10000) {
      if (callback()) {
        return
      }
      await delay(100)
    }
    throw new Error(\`\${message}. url=\${location.href}; transform=\${viewport.style.transform}; nodeClass=\${firstNode.className}\`)
  }
  zoomIn.click()
  await waitFor(() => viewport.style.transform !== initialTransform, 'Expected React Flow viewport to zoom')
  toggle.click()
  await waitFor(() => firstNode.className !== initialNodeClass, 'Expected React Flow interactivity to be disabled')
  toggle.click()
  await waitFor(() => firstNode.className === initialNodeClass, 'Expected React Flow interactivity to be restored')
  fitView.click()
  await waitFor(() => viewport.style.transform === initialTransform, 'Expected React Flow fit view to restore the initial transform')
  if (document.querySelectorAll('.react-flow__node').length !== 450) {
    throw new Error(\`Expected 450 React Flow nodes after controls cycle, got \${document.querySelectorAll('.react-flow__node').length}\`)
  }
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 25_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression: runExpression, timeout: 25_000 })
  await SimpleBrowser.shouldHaveText({ text: 'change pos', timeout: 10_000, urlPattern })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
