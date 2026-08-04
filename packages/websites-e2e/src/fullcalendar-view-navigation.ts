import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://fullcalendar.io/docs/event-dragging-resizing-demo'
const urlPattern = /^https:\/\/fullcalendar\.io\/docs\/event-dragging-resizing-demo\/?$/

const expression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getButton = (title) => document.querySelector(\`button[title="\${title}"]\`)
  const getTitle = () => (document.querySelector('h2')?.textContent || '').trim()
  const waitFor = async (callback, message) => {
    const start = Date.now()
    while (Date.now() - start < 10000) {
      if (callback()) return
      await delay(100)
    }
    throw new Error(\`${message}. url=\${location.href}; title=\${getTitle()}\`)
  }
  const previous = getButton('Previous Month')
  const next = getButton('Next Month')
  const month = getButton('Month view')
  const week = getButton('Week view')
  if (!(previous instanceof HTMLElement) || !(next instanceof HTMLElement) || !(month instanceof HTMLElement) || !(week instanceof HTMLElement)) {
    throw new Error(\`Expected FullCalendar navigation controls. url=\${location.href}\`)
  }
  const initialTitle = getTitle()
  if (!initialTitle) throw new Error('Expected FullCalendar initial title')
  next.click()
  await waitFor(() => getTitle() !== initialTitle, 'Expected FullCalendar to navigate to the next month')
  previous.click()
  await waitFor(() => getTitle() === initialTitle, 'Expected FullCalendar to restore the initial month')
  week.click()
  await waitFor(() => week.getAttribute('aria-pressed') === 'true' || week.classList.contains('fc-button-active'), 'Expected FullCalendar week view')
  month.click()
  await waitFor(() => month.getAttribute('aria-pressed') === 'true' || month.classList.contains('fc-button-active'), 'Expected FullCalendar month view to be restored')
  await waitFor(() => getTitle() === initialTitle, 'Expected FullCalendar title to remain restored')
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.shouldHaveText({ text: 'Month view', timeout: 20_000, urlPattern })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression, timeout: 25_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
