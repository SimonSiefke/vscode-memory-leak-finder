import type { TestContext } from '../types.js'

interface TodoMvcConfig {
  readonly heading: string
  readonly shadowHostSelector?: string
  readonly url: string
  readonly urlPattern: RegExp
}

interface TodoMvcTest {
  readonly run: (context: TestContext) => Promise<void>
  readonly setup: (context: TestContext) => Promise<void>
  readonly teardown: (context: TestContext) => Promise<void>
}

const taskTitle = 'website e2e memory task'

const getRootExpression = (shadowHostSelector: string | undefined): string => {
  if (!shadowHostSelector) {
    return 'document'
  }
  return `document.querySelector(${JSON.stringify(shadowHostSelector)})?.shadowRoot`
}

const getWaitForReadyExpression = (shadowHostSelector: string | undefined): string => {
  const rootExpression = getRootExpression(shadowHostSelector)
  return `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getRoot = () => ${rootExpression}
  const start = Date.now()
  while (Date.now() - start < 20000) {
    const root = getRoot()
    const input = root?.querySelector('.new-todo, input[placeholder="What needs to be done?"]')
    if (input instanceof HTMLInputElement) {
      return
    }
    await delay(100)
  }
  throw new Error(\`Timed out waiting for TodoMVC input. url=\${location.href}; shadowHost=${shadowHostSelector || '<none>'}\`)
})()`
}

const getRunExpression = (shadowHostSelector: string | undefined): string => {
  const rootExpression = getRootExpression(shadowHostSelector)
  return `(async () => {
  const taskTitle = ${JSON.stringify(taskTitle)}
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const getRoot = () => ${rootExpression}
  const getInput = () => getRoot()?.querySelector('.new-todo, input[placeholder="What needs to be done?"]')
  const getItems = () => Array.from(getRoot()?.querySelectorAll('.todo-list li') || [])
  const getSummary = () => {
    const root = getRoot()
    const input = getInput()
    return \`url=\${location.href}; input=\${input instanceof HTMLInputElement ? input.value : '<missing>'}; items=\${getItems().map((item) => item.textContent?.trim()).join(' | ') || '<none>'}; root=\${root ? 'ready' : 'missing'}\`
  }
  const waitFor = async (callback, message, timeout = 10000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const value = callback()
      if (value) {
        return value
      }
      await delay(100)
    }
    throw new Error(\`\${message}. \${getSummary()}\`)
  }
  const input = await waitFor(() => {
    const candidate = getInput()
    return candidate instanceof HTMLInputElement ? candidate : undefined
  }, 'Expected TodoMVC input')
  input.focus()
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (!setter) {
    throw new Error('Expected native input value setter')
  }
  setter.call(input, taskTitle)
  input.dispatchEvent(new InputEvent('input', { bubbles: true, data: taskTitle, inputType: 'insertText' }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  const keyboardOptions = { bubbles: true, cancelable: true, code: 'Enter', key: 'Enter', keyCode: 13, which: 13 }
  input.dispatchEvent(new KeyboardEvent('keydown', keyboardOptions))
  input.dispatchEvent(new KeyboardEvent('keypress', keyboardOptions))
  input.dispatchEvent(new KeyboardEvent('keyup', keyboardOptions))
  await delay(100)
  if (getItems().length === 0) {
    const form = input.closest('form')
    if (form instanceof HTMLFormElement) {
      form.requestSubmit()
    }
  }
  const item = await waitFor(() => {
    return getItems().find((candidate) => candidate.textContent?.includes(taskTitle))
  }, 'Expected newly created TodoMVC item')
  const toggle = item.querySelector('.toggle, input[type="checkbox"]')
  if (!(toggle instanceof HTMLInputElement)) {
    throw new Error(\`Expected TodoMVC item toggle. \${getSummary()}\`)
  }
  toggle.click()
  await waitFor(() => toggle.checked || item.classList.contains('completed'), 'Expected TodoMVC item to be completed')
  const clearCompleted = await waitFor(() => {
    const candidate = getRoot()?.querySelector('.clear-completed')
    return candidate instanceof HTMLElement ? candidate : undefined
  }, 'Expected TodoMVC clear-completed control')
  clearCompleted.click()
  await waitFor(() => getItems().length === 0, 'Expected TodoMVC list to be empty after clearing completed items')
  await waitFor(() => {
    const candidate = getInput()
    return candidate instanceof HTMLInputElement && candidate.value === ''
  }, 'Expected TodoMVC input to be empty')
  localStorage.clear()
  input.blur()
})()`
}

export const createTodoMvcTest = ({ heading, shadowHostSelector, url, urlPattern }: TodoMvcConfig): TodoMvcTest => {
  return {
    async setup({ Editor, Notification, SideBar, SimpleBrowser, Workspace }) {
      await Workspace.setFiles([])
      await Editor.closeAll()
      await SideBar.hide()
      await Notification.closeAll({ force: true })
      await SimpleBrowser.show({ url })
      await SimpleBrowser.executeJavaScript({
        expression: `localStorage.clear()`,
      })
      await SimpleBrowser.navigateIntegratedBrowser({
        url,
        waitForContentFrame: true,
      })
      await SimpleBrowser.shouldHaveText({
        selector: 'h1',
        text: heading,
        timeout: 20_000,
        urlPattern,
      })
      await SimpleBrowser.executeJavaScript({
        expression: getWaitForReadyExpression(shadowHostSelector),
        timeout: 25_000,
      })
    },
    async run({ SimpleBrowser }) {
      await SimpleBrowser.executeJavaScript({
        expression: getRunExpression(shadowHostSelector),
        timeout: 25_000,
      })
    },
    async teardown({ Editor }) {
      await Editor.closeAll()
    },
  }
}
