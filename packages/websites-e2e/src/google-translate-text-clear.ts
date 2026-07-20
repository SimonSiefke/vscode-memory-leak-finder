import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const translateUrl = 'https://translate.google.com/?sl=en&tl=de&op=translate'
const sourceText = 'hello world'
const translatedTextPattern = 'Hallo Welt'

export const setup = async ({ Editor, SimpleBrowser, Workspace, Notification, SideBar }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: translateUrl,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) {
      return false
    }
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
  }
  const findButtonByText = (patterns) => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
    return buttons.find((button) => {
      const text = [
        button.textContent || '',
        button.getAttribute('aria-label') || '',
        button.getAttribute('value') || '',
      ].join(' ')

      return patterns.some((pattern) => pattern.test(text))
    })
  }
  const waitForWindowLoad = async () => {
    if (document.readyState === 'complete') {
      return
    }
    await new Promise((resolve) => {
      window.addEventListener('load', resolve, { once: true })
    })
  }
  const waitForPageIdle = async () => {
    await new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(resolve, { timeout: 1500 })
      } else {
        setTimeout(resolve, 500)
      }
    })
    await delay(250)
  }
  const acceptConsent = findButtonByText([/accept all/i, /i agree/i, /agree/i])
  if (acceptConsent && isVisible(acceptConsent)) {
    acceptConsent.click()
    await waitForWindowLoad()
    await waitForPageIdle()
  }
  const waitFor = async (callback, message, timeout = 20000) => {
    const start = Date.now()
    let lastValue
    while (Date.now() - start < timeout) {
      lastValue = callback()
      if (lastValue) {
        return lastValue
      }
      await delay(250)
    }
    throw new Error(message)
  }
  const getSourceTextArea = () => {
    return document.querySelector('textarea[aria-label*="Source text" i], textarea[aria-label*="Enter text" i], textarea')
  }
  const typeIntoTextArea = (textArea, value) => {
    textArea.focus()
    textArea.select()
    if (!document.execCommand('insertText', false, value) || textArea.value !== value) {
      throw new Error(\`Expected typed text "\${value}" in Google Translate source text area, got "\${textArea.value}"\`)
    }
  }
  const clearTextArea = (textArea) => {
    textArea.focus()
    textArea.select()
    if (!document.execCommand('delete', false)) {
      throw new Error('Expected Google Translate source text to be deleted')
    }
  }
  await waitForWindowLoad()
  await waitForPageIdle()
  const sourceTextArea = await waitFor(() => {
    const textArea = getSourceTextArea()
    return textArea instanceof HTMLTextAreaElement && isVisible(textArea) ? textArea : undefined
  }, 'Expected Google Translate source text area')
  typeIntoTextArea(sourceTextArea, ${JSON.stringify(sourceText)})
  await waitForPageIdle()
  await waitFor(() => {
    const bodyText = document.body.textContent || ''
    return bodyText.includes(${JSON.stringify(translatedTextPattern)})
  }, 'Expected Google Translate translated output')
  const clearButton =
    document.querySelector('button[aria-label*="Clear source text" i], button[aria-label*="Clear" i], [role="button"][aria-label*="Clear" i]') ||
    findButtonByText([/clear source text/i, /^clear$/i])
  if (clearButton instanceof HTMLElement && isVisible(clearButton)) {
    clearButton.click()
  } else {
    clearTextArea(sourceTextArea)
  }
  await waitForPageIdle()
  await waitFor(() => {
    const textArea = getSourceTextArea()
    if (!(textArea instanceof HTMLTextAreaElement) || textArea.value !== '') {
      return false
    }
    const translationNodes = Array.from(document.querySelectorAll('[data-language-for-alternatives], [aria-live], span[jsname="W297wb"]'))
    const translationText = translationNodes.map((node) => node.textContent || '').join(' ')
    return !translationText.includes(${JSON.stringify(translatedTextPattern)})
  }, 'Expected Google Translate source and translation output to be cleared')
})()`,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
