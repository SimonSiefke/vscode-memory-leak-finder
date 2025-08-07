// based on https://github.com/microsoft/playwright/blob/92375f63338c32aee8c4f3f9b70660577e1a87f2/packages/playwright-core/src/server/electron/loader.ts by Microsoft (License Apache 2.0)

// it is necessary to defer the app ready event to avoid
// race conditions when attaching to the debugger
// when using --remote-debugging-port
export const monkeyPatchElectronScript = `function () {
  const electron = this
  const { app } = electron
  const originalWhenReady = app.whenReady()
  const originalEmit = app.emit.bind(app)

  let readyEventArgs
  let whenReadyCallback
  let isReady = false

  const whenReadyPromise = new Promise(resolve => {
    whenReadyCallback = resolve
  })

  const patchedAppEmit = (event, ...args) => {
    if (event === 'ready') {
      readyEventArgs = args;
      return app.listenerCount('ready') > 0;
    }
    return originalEmit(event, ...args)
  }

  const patchedWhenReady = () => {
    return whenReadyPromise
  }

  const patchedIsReady = () => {
    return isReady
  }

  app.commandLine.appendSwitch('js-flags', "--allow-natives-syntax");

  app.emit = patchedAppEmit
  app.whenReady = patchedWhenReady
  app.isReady = patchedIsReady

  return async () => {
    const event = await originalWhenReady
    isReady = true
    whenReadyCallback(event)
    originalEmit('ready', ...readyEventArgs)
  }
}
`

export const undoMonkeyPatch = `function () {
  const fn = this
  return fn()
}`
