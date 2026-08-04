import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url = 'https://ckeditor.com/docs/ckeditor5/latest/examples/builds-custom/full-featured-editor.html'
const urlPattern = /^https:\/\/ckeditor\.com\/docs\/ckeditor5\/latest\/examples\/builds-custom\/full-featured-editor\.html$/

const expression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) return false
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  }
  const getButton = (label) => Array.from(document.querySelectorAll('button[aria-label]')).find((button) => button.getAttribute('aria-label') === label && isVisible(button))
  const consent = Array.from(document.querySelectorAll('button')).find((button) => /allow all cookies/i.test(button.textContent || ''))
  consent?.click()
  const waitFor = async (callback, message) => {
    const start = Date.now()
    while (Date.now() - start < 15000) {
      const value = callback()
      if (value) return value
      await delay(100)
    }
    throw new Error(\`\${message}. url=\${location.href}; visibleButtons=\${Array.from(document.querySelectorAll('button')).filter(isVisible).map((button) => button.getAttribute('aria-label') || button.textContent?.trim()).filter(Boolean).slice(0, 30).join(' | ')}\`)
  }
  const findAndReplace = await waitFor(() => getButton('Find and replace'), 'Expected CKEditor Find and replace')
  findAndReplace.click()
  const findInput = await waitFor(() => {
    const candidate = document.querySelector('input[placeholder="Find in text…"]')
    return candidate instanceof HTMLInputElement && isVisible(candidate) ? candidate : undefined
  }, 'Expected CKEditor find input')
  const findPanel = findInput.closest('.ck-find-and-replace-form, .ck-balloon-panel, .ck')
  const close = Array.from((findPanel || document).querySelectorAll('button[aria-label="Close"]')).find(isVisible) || getButton('Close')
  if (!(close instanceof HTMLElement)) throw new Error('Expected CKEditor find panel close control')
  close.click()
  await waitFor(() => !isVisible(document.querySelector('input[placeholder="Find in text…"]')), 'Expected CKEditor find panel to close')
  const enterFullscreen = await waitFor(() => getButton('Enter fullscreen mode'), 'Expected CKEditor fullscreen control')
  enterFullscreen.click()
  const exitFullscreen = await waitFor(() => getButton('Exit fullscreen mode'), 'Expected CKEditor to enter fullscreen')
  exitFullscreen.click()
  await waitFor(() => getButton('Enter fullscreen mode'), 'Expected CKEditor to exit fullscreen')
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.shouldHaveText({ selector: 'h1', text: 'Feature-rich editor', timeout: 20_000, urlPattern })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression, timeout: 30_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
