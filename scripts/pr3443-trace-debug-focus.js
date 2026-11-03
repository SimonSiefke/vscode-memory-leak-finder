export const traceDebugFocus = async (page) => {
  const rpc = page.sessionRpc
  const invoke = async (method, params = {}) => {
    const raw = await rpc.invoke(method, params)
    if (raw.error || raw.result?.exceptionDetails) throw new Error(JSON.stringify(raw))
    return raw.result
  }
  await invoke('Debugger.enable')
  const node = await invoke('Runtime.evaluate', {
    objectGroup: 'debug-focus',
    expression: `document.querySelector('.repl-input-wrapper .native-edit-context')`,
  })
  const { listeners } = await invoke('DOMDebugger.getEventListeners', { objectId: node.result.objectId })
  const listener = listeners.find((item) => item.type === 'blur' && item.handler?.description.includes('NativeEditContext.blur'))
  const { breakpointId } = await invoke('Debugger.setBreakpointOnFunctionCall', { objectId: listener.handler.objectId })
  const captured = Promise.withResolvers()
  rpc.on('Debugger.paused', async (message) => {
    try {
      const callFrameId = message.params.callFrames[0].callFrameId
      const result = await invoke('Debugger.evaluateOnCallFrame', {
        callFrameId,
        returnByValue: true,
        expression: `(() => { globalThis.__debugTracker=this; globalThis.__debugTrace=[]; const original=this._handleFocusedChanged; this._handleFocusedChanged=function(value){globalThis.__debugTrace.push({value,connected:this._domNode.isConnected,active:this._domNode===document.activeElement,stack:new Error().stack}); return original.call(this,value)}; return {focused:this._isFocused,paused:this._isPaused,active:this._domNode===document.activeElement,connected:this._domNode.isConnected,editor:this._domNode.closest('.monaco-editor')?.outerHTML.slice(0,500)} })()`,
      })
      console.log('DEBUG FOCUS BEFORE HIDE', JSON.stringify(result))
      await invoke('Debugger.removeBreakpoint', { breakpointId })
      captured.resolve()
    } catch (error) {
      console.log('DEBUG FOCUS TRACE ERROR', String(error))
      captured.reject(error)
    } finally {
      await invoke('Debugger.resume').catch((error) => console.log('DEBUG FOCUS RESUME ERROR', String(error)))
    }
  })
  try {
    await Promise.race([
      Promise.all([
        invoke('Runtime.evaluate', {
          expression: `document.querySelector('.repl-input-wrapper .native-edit-context').dispatchEvent(new FocusEvent('blur'))`,
        }),
        captured.promise,
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('debug trace timeout')), 30000).unref()),
    ])
  } finally {
    await invoke('Debugger.disable')
    delete rpc.listeners['Debugger.paused']
  }
}
