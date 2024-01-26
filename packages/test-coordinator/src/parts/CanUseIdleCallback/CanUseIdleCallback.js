// for some reason, requestIdleCallback doesn't work
// when running vscode locally in headless mode
export const canUseIdleCallback = (headlessMode) => {
  if (headlessMode) {
    return !Boolean(process.env.VSCODE_PATH)
  }
  return true
}
