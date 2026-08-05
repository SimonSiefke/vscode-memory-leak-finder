import type { TestContext } from '../types.ts'

export const skip = 1

interface ThemeState {
  readonly background: string
  readonly label: string
}

const getEditorBackground = async (Workbench: TestContext['Workbench']): Promise<string> => {
  const background = await Workbench.evaluate({
    expression: `getComputedStyle(document.querySelector('.monaco-workbench')).getPropertyValue('--vscode-editor-background')`,
    returnByValue: true,
  })
  if (typeof background !== 'string') {
    throw new Error(`Expected editor background to be a string`)
  }
  return background
}

const waitForEditorBackground = async (
  Workbench: TestContext['Workbench'],
  previousBackground: string,
  expectedBackground = '',
): Promise<string> => {
  const background = await Workbench.evaluate({
    awaitPromise: true,
    expression: `new Promise((resolve, reject) => {
      const workbench = document.querySelector('.monaco-workbench')
      const getBackground = () => getComputedStyle(workbench).getPropertyValue('--vscode-editor-background')
      const deadline = performance.now() + 1000
      const check = () => {
        const current = getBackground()
        if (${JSON.stringify(expectedBackground)} ? current === ${JSON.stringify(expectedBackground)} : current !== ${JSON.stringify(previousBackground)}) {
          resolve(current)
        } else if (performance.now() >= deadline) {
          reject(new Error('Editor background remained "' + current + '"'))
        } else {
          requestAnimationFrame(check)
        }
      }
      check()
    })`,
    returnByValue: true,
  })
  if (typeof background !== 'string') {
    throw new Error(`Expected editor background to be a string`)
  }
  return background
}

const getThemeState = async ({ QuickPick, Workbench }: TestContext, background = ''): Promise<ThemeState> => {
  const label = await QuickPick.getFocusedItemLabel()
  return {
    background: background || (await getEditorBackground(Workbench)),
    label,
  }
}

export const run = async (context: TestContext): Promise<void> => {
  const { QuickPick, Workbench } = context
  await QuickPick.showColorTheme()
  const initial = await getThemeState(context)

  await QuickPick.focusNext()
  const nextBackground = await waitForEditorBackground(Workbench, initial.background)
  const next = await getThemeState(context, nextBackground)

  await QuickPick.focusNext()
  await waitForEditorBackground(Workbench, next.background)

  await QuickPick.focusPrevious()
  await QuickPick.focusPrevious()
  const restoredBackground = await waitForEditorBackground(Workbench, next.background, initial.background)
  const restored = await getThemeState(context, restoredBackground)
  if (restored.label !== initial.label || restored.background !== initial.background) {
    throw new Error(`Expected color theme "${initial.label}" with background "${initial.background}" to be restored`)
  }

  await QuickPick.hide()
}
