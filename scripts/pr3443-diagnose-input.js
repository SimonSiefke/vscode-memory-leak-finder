import { getPageObjectContext } from '../packages/test-worker/src/parts/PageObjectState/PageObjectState.ts'

export const diagnoseTyping = async (context, text) => {
  const { sessionRpc: rpc } = getPageObjectContext(1)
  const invoke = async (method, params = {}) => {
    const raw = await rpc.invoke(method, params)
    if (raw.error || raw.result?.exceptionDetails) throw new Error(JSON.stringify(raw))
    return raw.result
  }
  await invoke('Debugger.enable')
  const editContext = await invoke('Runtime.evaluate', {
    objectGroup: 'markdown-diagnostic',
    expression: `document.querySelector('.editor-instance .native-edit-context').editContext`,
  })
  const { listeners } = await invoke('DOMDebugger.getEventListeners', { objectId: editContext.result.objectId })
  const listener = listeners.find((item) => item.type === 'textupdate')
  if (!listener) throw new Error('No native textupdate listener')
  const { breakpointId } = await invoke('Debugger.setBreakpointOnFunctionCall', { objectId: listener.handler.objectId })
  let step = 0
  let delegateBreakpoint = ''
  const diagnostic = Promise.withResolvers()
  rpc.on('Debugger.paused', async (message) => {
    try {
      const { callFrames } = message.params
      const frame = callFrames[0]
      console.log('MARKDOWN PAUSE', step, frame.functionName, frame.this.description)
      if (step++ === 0) {
        await invoke('Debugger.evaluateOnCallFrame', { callFrameId: frame.callFrameId, expression: 'globalThis.__markdownNative=this' })
        const delegate = await invoke('Debugger.evaluateOnCallFrame', {
          callFrameId: frame.callFrameId,
          expression: 'this._viewController.commandDelegate.type',
        })
        const result = await invoke('Debugger.setBreakpointOnFunctionCall', { objectId: delegate.result.objectId })
        delegateBreakpoint = result.breakpointId
        await invoke('Debugger.removeBreakpoint', { breakpointId })
      } else {
        await invoke('Debugger.evaluateOnCallFrame', {
          callFrameId: frame.callFrameId,
          expression: `globalThis.__markdownEditor=this; globalThis.__markdownCommands=[]; globalThis.__markdownSubscription=this._commandService.onWillExecuteCommand(e=>{if(e.commandId==='type'||e.commandId==='compositionType') globalThis.__markdownCommands.push({id:e.commandId,args:e.args,focused:this._codeEditorService.getFocusedCodeEditor()?.getModel()?.uri?.toString()})});`,
        })
        await invoke('Debugger.removeBreakpoint', { breakpointId: delegateBreakpoint })
        diagnostic.resolve()
      }
    } catch (error) {
      diagnostic.reject(error)
    } finally {
      await invoke('Debugger.resume')
    }
  })
  try {
    await Promise.race([
      Promise.all([context.Editor.typeCharacters(text), diagnostic.promise]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Markdown diagnostic timed out')), 30000).unref()),
    ])
    const result = await invoke('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => { const editor=globalThis.__markdownEditor; return { delegate:globalThis.__markdownNative._viewController.commandDelegate.type.toString(),serviceFields:Object.keys(editor._commandService),activationDone:editor._commandService._extensionService?.activationEventIsDone('onCommand:type'),extensionHostReady:editor._commandService._extensionHostIsReady, model: editor.getModel()?.uri?.toString(), length: editor.getModel()?.getValueLength(), editors:editor._codeEditorService.listCodeEditors().map(e=>({id:e.getId(),uri:e.getModel()?.uri?.toString(),length:e.getModel()?.getValueLength(),textFocus:e.hasTextFocus(),widgetFocus:e.hasWidgetFocus(),readOnly:e.getRawOptions().readOnly})), commands:globalThis.__markdownCommands }; })()`,
    })
    console.log('MARKDOWN DIAGNOSTIC', JSON.stringify(result))
  } finally {
    await invoke('Runtime.evaluate', { expression: 'globalThis.__markdownSubscription?.dispose()' })
    await invoke('Debugger.disable')
    delete rpc.listeners['Debugger.paused']
  }
}
