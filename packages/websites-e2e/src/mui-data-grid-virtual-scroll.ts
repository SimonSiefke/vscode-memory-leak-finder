import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://mui.com/x/react-data-grid/virtualization/'
const urlPattern = /^https:\/\/mui\.com\/x\/react-data-grid\/virtualization\/?$/

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const consent = Array.from(document.querySelectorAll('button')).find((button) => /^(essential only|allow analytics)$/i.test((button.textContent || '').trim()))
  consent?.click()
  const start = Date.now()
  while (Date.now() - start < 20000) {
    const grid = document.querySelector('[role="grid"][aria-colcount="1000"]')
    const scroller = grid?.querySelector('.MuiDataGrid-virtualScroller')
    if (grid && scroller && scroller.scrollWidth > scroller.clientWidth && scroller.scrollHeight > scroller.clientHeight) {
      return
    }
    await delay(100)
  }
  throw new Error(\`Timed out waiting for the MUI 1000-column virtualized grid. url=\${location.href}\`)
})()`

const runExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const grid = document.querySelector('[role="grid"][aria-colcount="1000"]')
  const scroller = grid?.querySelector('.MuiDataGrid-virtualScroller')
  if (!(grid instanceof HTMLElement) || !(scroller instanceof HTMLElement)) {
    throw new Error(\`Expected MUI virtualized grid and scroller. url=\${location.href}\`)
  }
  const getCells = () => Array.from(grid.querySelectorAll('[role="gridcell"]')).map((cell) => (cell.textContent || '').trim())
  const waitForCell = async (text, message) => {
    const start = Date.now()
    while (Date.now() - start < 10000) {
      if (getCells().includes(text)) {
        return
      }
      await delay(100)
    }
    throw new Error(\`${message}. url=\${location.href}; scroll=\${scroller.scrollLeft},\${scroller.scrollTop}; cells=\${getCells().slice(0, 20).join(' | ')}\`)
  }
  scroller.scrollTo({ left: scroller.scrollWidth, top: scroller.scrollHeight })
  await waitForCell('99, 1000', 'Expected bottom-right virtualized cell')
  scroller.scrollTo({ left: 0, top: 0 })
  await waitForCell('0, 1', 'Expected top-left virtualized cell after restoring scroll')
  if (scroller.scrollLeft !== 0 || scroller.scrollTop !== 0) {
    throw new Error(\`Expected restored MUI grid scroll position. left=\${scroller.scrollLeft}; top=\${scroller.scrollTop}\`)
  }
  scroller.blur()
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.shouldHaveText({ selector: 'h1', text: 'Data Grid - Virtualization', timeout: 20_000, urlPattern })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 25_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression: runExpression, timeout: 25_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
