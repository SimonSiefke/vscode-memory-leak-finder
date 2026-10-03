import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const chatGptUrl = 'https://chatgpt.com/'
const responseMarker = 'CHATGPT_E2E_READY'
const prompt = `Reply with exactly ${responseMarker}.`

const waitForComposerExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) {
      return false
    }
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
  }
  const getComposer = () => {
    const candidates = Array.from(
      document.querySelectorAll(
        '#prompt-textarea, [data-testid="prompt-textarea"], textarea[placeholder*="Message" i], [contenteditable="true"][data-virtualkeyboard]',
      ),
    )
    return candidates.find(isVisible)
  }
  const getPageSummary = () => {
    const bodyText = (document.body.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 400)
    return \`url=\${location.href}; title=\${document.title}; body=\${bodyText || '<empty>'}\`
  }
  const getBlockingError = () => {
    const pageText = \`\${document.title} \${document.body.textContent || ''}\`
    if (/just a moment|verify you are human|cloudflare security challenge/i.test(pageText)) {
      return \`ChatGPT is blocked by a Cloudflare challenge. \${getPageSummary()}\`
    }
    return ''
  }
  const start = Date.now()
  while (Date.now() - start < 45000) {
    const blockingError = getBlockingError()
    if (blockingError) {
      throw new Error(blockingError)
    }
    if (getComposer()) {
      return
    }
    await delay(250)
  }
  const pageText = document.body.textContent || ''
  if (/log in to continue|sign up to continue|create an account to continue/i.test(pageText)) {
    throw new Error(\`Anonymous ChatGPT access is unavailable. \${getPageSummary()}\`)
  }
  throw new Error(\`Timed out waiting for the ChatGPT composer. \${getPageSummary()}\`)
})()`

const runExpression = `(async () => {
  const prompt = ${JSON.stringify(prompt)}
  const responseMarker = ${JSON.stringify(responseMarker)}
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const isVisible = (element) => {
    if (!element) {
      return false
    }
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
  }
  const getElementText = (element) => {
    return [
      element.textContent || '',
      element.getAttribute('aria-label') || '',
      element.getAttribute('title') || '',
    ]
      .join(' ')
      .replace(/\\s+/g, ' ')
      .trim()
  }
  const getComposer = () => {
    const candidates = Array.from(
      document.querySelectorAll(
        '#prompt-textarea, [data-testid="prompt-textarea"], textarea[placeholder*="Message" i], [contenteditable="true"][data-virtualkeyboard]',
      ),
    )
    return candidates.find(isVisible)
  }
  const getComposerText = (composer) => {
    if (composer instanceof HTMLInputElement || composer instanceof HTMLTextAreaElement) {
      return composer.value.trim()
    }
    return (composer.textContent || '').trim()
  }
  const getPageSummary = () => {
    const bodyText = (document.body.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 400)
    return \`url=\${location.href}; title=\${document.title}; body=\${bodyText || '<empty>'}\`
  }
  const getBlockingError = () => {
    const pageText = \`\${document.title} \${document.body.textContent || ''}\`
    if (/just a moment|verify you are human|cloudflare security challenge/i.test(pageText)) {
      return \`ChatGPT is blocked by a Cloudflare challenge. \${getPageSummary()}\`
    }
    if (/too many requests|rate limit|you(?:'|’)ve reached (?:the )?.*limit|try again later/i.test(pageText)) {
      return \`ChatGPT rate limited the anonymous test. \${getPageSummary()}\`
    }
    if (/log in to continue|sign up to continue|create an account to continue/i.test(pageText)) {
      return \`Anonymous ChatGPT access is unavailable. \${getPageSummary()}\`
    }
    return ''
  }
  const waitFor = async (callback, message, timeout) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const blockingError = getBlockingError()
      if (blockingError) {
        throw new Error(blockingError)
      }
      const value = callback()
      if (value) {
        return value
      }
      await delay(250)
    }
    throw new Error(\`\${message}. \${getPageSummary()}\`)
  }
  const setComposerText = (composer, value) => {
    composer.focus()
    if (composer instanceof HTMLInputElement || composer instanceof HTMLTextAreaElement) {
      const prototype = composer instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
      if (!setter) {
        throw new Error('Expected a native ChatGPT composer value setter')
      }
      setter.call(composer, value)
      composer.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
    } else {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(composer)
      selection?.removeAllRanges()
      selection?.addRange(range)
      if (!document.execCommand('insertText', false, value)) {
        composer.textContent = value
        composer.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
      }
    }
    if (getComposerText(composer) !== value) {
      throw new Error(\`Expected ChatGPT composer text "\${value}", got "\${getComposerText(composer)}"\`)
    }
  }
  const getAssistantMessages = () => {
    const semanticMessages = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]')).filter(isVisible)
    if (semanticMessages.length > 0) {
      return semanticMessages
    }
    return Array.from(document.querySelectorAll('article[data-testid^="conversation-turn-"]')).filter((element) => {
      return isVisible(element) && /chatgpt said|assistant/i.test(getElementText(element))
    })
  }
  const getSendButton = () => {
    const candidates = Array.from(
      document.querySelectorAll(
        'button[data-testid="send-button"], button[aria-label*="Send prompt" i], button[aria-label="Send message"], button[aria-label*="Send" i]',
      ),
    )
    return candidates.find((element) => {
      return (
        isVisible(element) &&
        !(element instanceof HTMLButtonElement && element.disabled) &&
        element.getAttribute('aria-disabled') !== 'true'
      )
    })
  }
  const getNewChatButton = () => {
    const stableCandidates = Array.from(
      document.querySelectorAll(
        '[data-testid="create-new-chat-button"], a[aria-label="New chat" i], button[aria-label="New chat" i], [title="New chat" i]',
      ),
    )
    const stableCandidate = stableCandidates.find(isVisible)
    if (stableCandidate) {
      return stableCandidate
    }
    const semanticCandidates = Array.from(document.querySelectorAll('a, button, [role="button"]'))
    return semanticCandidates.find((element) => isVisible(element) && /^new chat$/i.test(getElementText(element)))
  }
  const composer = await waitFor(getComposer, 'Expected the ChatGPT composer', 10000)
  setComposerText(composer, prompt)
  const sendButton = await waitFor(getSendButton, 'Expected the ChatGPT send button to become enabled', 10000)
  sendButton.click()
  await waitFor(
    () => {
      return getAssistantMessages().some((element) => getElementText(element).includes(responseMarker))
    },
    \`Timed out waiting for a ChatGPT response containing \${responseMarker}\`,
    90000,
  )
  const newChatButton = await waitFor(getNewChatButton, 'Expected the ChatGPT New chat control', 10000)
  newChatButton.click()
  await waitFor(
    () => {
      const currentComposer = getComposer()
      const hasOldResponse = getAssistantMessages().some((element) => getElementText(element).includes(responseMarker))
      return (
        currentComposer &&
        getComposerText(currentComposer) === '' &&
        !hasOldResponse &&
        location.hostname === 'chatgpt.com' &&
        location.pathname === '/'
      )
    },
    'Timed out waiting for ChatGPT to return to a blank new chat',
    20000,
  )
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({
    url: chatGptUrl,
  })
  await SimpleBrowser.executeJavaScript({
    expression: waitForComposerExpression,
    timeout: 50_000,
  })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: runExpression,
    timeout: 130_000,
  })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
