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
  const acceptConsent = findButtonByText([/accept all/i, /i agree/i, /agree/i])
  if (acceptConsent && isVisible(acceptConsent)) {
    acceptConsent.click()
    await delay(1500)
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
  const sourceTextArea = await waitFor(() => {
    const textArea = getSourceTextArea()
    return textArea instanceof HTMLTextAreaElement && isVisible(textArea) ? textArea : undefined
  }, 'Expected Google Translate source text area')
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (!valueSetter) {
    throw new Error('Expected textarea value setter')
  }
  sourceTextArea.focus()
  valueSetter.call(sourceTextArea, ${JSON.stringify(sourceText)})
  sourceTextArea.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(sourceText)}, inputType: 'insertText' }))
  sourceTextArea.dispatchEvent(new Event('change', { bubbles: true }))
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
    sourceTextArea.focus()
    valueSetter.call(sourceTextArea, '')
    sourceTextArea.dispatchEvent(new InputEvent('input', { bubbles: true, data: null, inputType: 'deleteContentBackward' }))
    sourceTextArea.dispatchEvent(new Event('change', { bubbles: true }))
  }
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
