// The UI normally disposes its readers when a session is hidden. Keep one real
// canvas observable reader alive to exercise the inactive-observer contract.
// Capture only the UI-created adapter, then release every debugger handle before
// asserting subscription traffic. Never query/retain subscription heap objects.
export const create = (page: any) => {
  const group = 'inbox-canvas-observer'
  const adapters: string[] = []
  let breakpoint: string | undefined
  let captureError: unknown
  let parsedListener: ((message: any) => void) | undefined
  let pausedListener: ((message: any) => void) | undefined
  let debugging = false

  const invoke = async (method: string, params?: unknown) => {
    const response = await page.rpc.invoke(method, params)
    if (response.error) throw new Error(`${method}: ${response.error.message}`)
    if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.exception?.description || `${method} failed`)
    return response.result
  }
  const finishCapture = async () => {
    const errors: unknown[] = []
    const cleanup = async (method: string, params?: unknown) => {
      try {
        await invoke(method, params)
      } catch (error) {
        errors.push(error)
      }
    }
    if (breakpoint) await cleanup('Debugger.removeBreakpoint', { breakpointId: breakpoint })
    breakpoint = undefined
    if (debugging) await cleanup('Debugger.disable')
    debugging = false
    if (page.rpc.listeners['Debugger.scriptParsed'] === parsedListener) delete page.rpc.listeners['Debugger.scriptParsed']
    if (page.rpc.listeners['Debugger.paused'] === pausedListener) delete page.rpc.listeners['Debugger.paused']
    parsedListener = undefined
    pausedListener = undefined
    adapters.length = 0
    await cleanup('Runtime.releaseObjectGroup', { objectGroup: group })
    if (errors.length) throw new AggregateError(errors, 'Could not fully release renderer debugger capture')
  }
  return {
    async arm() {
      if (debugging) throw new Error('A canvas observer capture is already armed')
      if (page.rpc.listeners['Debugger.paused'] || page.rpc.listeners['Debugger.scriptParsed'])
        throw new Error('Canvas observer capture requires exclusive renderer debugger listeners')
      captureError = undefined
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        const script = new Promise<{ scriptId: string; url: string }>((resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Sessions renderer script was not reported')), 15_000)
          parsedListener = (message) => {
            if (message.params.url.endsWith('/vs/sessions/sessions.desktop.main.js')) resolve(message.params)
          }
          page.rpc.on('Debugger.scriptParsed', parsedListener)
        })
        pausedListener = async (message) => {
          try {
            if (!message.params.hitBreakpoints?.includes(breakpoint)) throw new Error('Unexpected renderer pause during canvas capture')
            const result = await invoke('Debugger.evaluateOnCallFrame', {
              callFrameId: message.params.callFrames[0].callFrameId,
              expression: 'this',
              objectGroup: group,
            })
            if (!result.result.objectId) throw new Error('No UI session adapter at the canvas breakpoint')
            adapters.push(result.result.objectId)
          } catch (error) {
            captureError = error
          } finally {
            try {
              await invoke('Debugger.resume')
            } catch (error) {
              captureError ??= error
            }
          }
        }
        page.rpc.on('Debugger.paused', pausedListener)
        await invoke('Debugger.enable')
        debugging = true
        const { scriptId, url } = await script
        const { scriptSource } = await invoke('Debugger.getScriptSource', { scriptId })
        const matches = [...scriptSource.matchAll(/_createChatCanvases\([^)]*\)\s*\{/g)]
        if (matches.length !== 1) throw new Error(`Expected one real canvas factory, got ${matches.length}`)
        const offset = matches[0].index + matches[0][0].length
        const prefix = scriptSource.slice(0, offset)
        const result = await invoke('Debugger.setBreakpointByUrl', {
          url,
          lineNumber: prefix.split('\n').length - 1,
          columnNumber: offset - prefix.lastIndexOf('\n') - 1,
        })
        breakpoint = result.breakpointId
        if (!result.locations?.length) throw new Error('Canvas factory breakpoint did not resolve')
      } catch (error) {
        await finishCapture()
        throw error
      } finally {
        clearTimeout(timer)
      }
    },
    async keep(title: string) {
      try {
        if (captureError) throw captureError
        let installed = false
        for (const objectId of adapters) {
          const result = await invoke('Runtime.callFunctionOn', {
            objectId,
            objectGroup: group,
            returnByValue: true,
            arguments: [{ value: title }],
            functionDeclaration: `function (title) {
              if (this.title?.get?.() !== title) return false
              const observable = this.mainChat.get().canvases
              if (!observable) throw new Error('UI session has no canvas observable')
              const readers = globalThis.__vmlfInboxCanvasObservers ||= new Map()
              if (readers.has(title)) return true
              let depth = 0
              const observer = {
                beginUpdate() { depth++ },
                endUpdate() { if (--depth === 0) observable.get() },
                handlePossibleChange() {},
                handleChange() {},
              }
              observable.addObserver(observer)
              try { observable.get() } catch (error) { observable.removeObserver(observer); throw error }
              readers.set(title, () => { observable.removeObserver(observer); readers.delete(title) })
              return true
            }`,
          })
          if (result.result.value === true) {
            installed = true
            break
          }
        }
        if (!installed) throw new Error(`No captured UI canvas observer for conversation ${title}`)
      } finally {
        await finishCapture()
      }
    },
    async dispose() {
      try {
        await finishCapture()
      } finally {
        await page.evaluateInMainWorld({
          expression: `(() => {
          const readers = globalThis.__vmlfInboxCanvasObservers
          if (readers) { for (const dispose of [...readers.values()]) dispose(); delete globalThis.__vmlfInboxCanvasObservers }
        })()`,
        })
      }
    },
  }
}
