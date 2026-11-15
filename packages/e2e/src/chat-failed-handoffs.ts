import type { TestContext } from '../types.ts'

// Opt-in: the ownership probe imports private modules from an unbundled development build.
export const skip = 1

const command = async ({ QuickPick, Notification }: TestContext, name: string): Promise<void> => {
  await Notification.closeAll({ force: true })
  await QuickPick.executeCommand(`Chat Failed Handoffs: ${name}`)
  await Notification.shouldHaveItem(`Chat Failed Handoffs: ${name.toLowerCase()} complete`)
  await Notification.closeAll({ force: true })
}

const waitForHandoff = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      const check = () => {
        const p = globalThis.__failedHandoffProbe
        if (p.completed === p.beforeCompleted + 1) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Handoff did not complete: ' + JSON.stringify({ acquired: p.acquired, completed: p.completed, mode: p.mode, error: p.lastError, terminated: !!p.inline?.deref()?.terminationState.get() })))
        setTimeout(check, 50)
      }
      check()
    })`,
    awaitPromise: true,
  })
}

export const setup = async (context: TestContext): Promise<void> => {
  await context.Editor.closeAll()
  await command(context, 'Setup')
  await context.Workbench.evaluate({
    expression: `(async () => {
      if (globalThis.__failedHandoffProbe) throw new Error('Handoff probe already installed')
      const load = path => import(new URL('vs/workbench/contrib/' + path + '.js', globalThis._VSCODE_FILE_ROOT).href)
      const { ChatService } = await load('chat/common/chatService/chatServiceImpl')
      const { ChatWidgetService } = await load('chat/browser/widget/chatWidgetService')
      const { InlineChatController } = await load('inlineChat/browser/inlineChatController')
      const { InlineChatSessionServiceImpl } = await load('inlineChat/browser/inlineChatSessionServiceImpl')
      if (![ChatService?.prototype.startNewLocalSession, ChatWidgetService?.prototype.openSession, InlineChatController?.prototype.continueSessionInChat, InlineChatSessionServiceImpl?.prototype.createSession].every(method => typeof method === 'function')) throw new Error('Requires an unbundled build with local chat handoff ownership APIs')
      const p = globalThis.__failedHandoffProbe = { mode: '', acquired: 0, disposeCalls: 0, failed: 0, opened: 0, records: [], completed: 0 }
      const start = ChatService.prototype.startNewLocalSession
      const open = ChatWidgetService.prototype.openSession
      const create = InlineChatSessionServiceImpl.prototype.createSession
      const handoff = InlineChatController.prototype.continueSessionInChat
      InlineChatController.prototype.continueSessionInChat = async function (...args) {
        p.lastError = undefined
        try { await handoff.apply(this, args) } catch (error) { p.lastError = String(error) } finally { p.completed++ }
      }
      InlineChatSessionServiceImpl.prototype.createSession = async function (...args) {
        const session = await create.apply(this, args)
        p.inline = new WeakRef(session)
        return session
      }
      ChatService.prototype.startNewLocalSession = function (...args) {
        const ref = start.apply(this, args)
        if (args[1]?.debugOwner === 'InlineChat#askInPanelChat') {
          p.acquired++
          p.service = new WeakRef(this)
          p.records.push(new WeakRef(ref.object))
          const dispose = ref.dispose.bind(ref)
          let didDispose = false
          ref.dispose = () => {
            if (!didDispose) { didDispose = true; p.disposeCalls++ }
            return dispose()
          }
        }
        return ref
      }
      ChatWidgetService.prototype.openSession = async function (resource, ...args) {
        if (p.records.some(record => record.deref()?.sessionResource.toString() === resource.toString())) {
          p.opened++
          if (p.mode === 'open-failure') { p.failed++; throw new Error('HANDOFF_FIXTURE_FAILURE') }
          if (p.mode === 'cancel') {
            p.inline.deref().dispose()
            p.failed++
            return undefined
          }
        }
        return open.call(this, resource, ...args)
      }
      p.restore = () => {
        ChatService.prototype.startNewLocalSession = start
        InlineChatController.prototype.continueSessionInChat = handoff
        ChatWidgetService.prototype.openSession = open
        InlineChatSessionServiceImpl.prototype.createSession = create
        delete globalThis.__failedHandoffProbe
      }
    })()`,
    awaitPromise: true,
  })
}

export const run = async (context: TestContext): Promise<void> => {
  for (const mode of ['open-failure', 'cancel']) {
    await command(context, 'Start')
    await context.Workbench.evaluate({
      expression: `(() => { const p = globalThis.__failedHandoffProbe; p.before = p.acquired; p.beforeCompleted = p.completed; p.mode = ${JSON.stringify(mode)} })()`,
    })
    await command(context, 'Handoff')
    await waitForHandoff(context)
    await context.Workbench.evaluate({
      expression: `(async () => {
      const p = globalThis.__failedHandoffProbe
      await p.service?.deref().waitForModelDisposals()
      if (!p.lastError || (p.mode === 'open-failure' && !p.lastError.includes('HANDOFF_FIXTURE_FAILURE')) || (p.mode === 'cancel' && !p.lastError.includes('Canceled'))) throw new Error('Expected handoff failure was not observed: ' + JSON.stringify({ error: p.lastError, mode: p.mode, acquired: p.acquired, opened: p.opened, failed: p.failed, completed: p.completed }))
      if (p.acquired !== p.before + 1 || p.opened !== p.acquired || p.failed !== p.acquired || p.disposeCalls !== p.acquired) {
        throw new Error('Handoff ownership mismatch: ' + JSON.stringify({ acquired: p.acquired, opened: p.opened, failed: p.failed, disposeCalls: p.disposeCalls }))
      }
      if (p.records.some(record => { const model = record.deref(); return model && !model._store.isDisposed })) throw new Error('Failed handoff ChatModel remains live')
    })()`,
      awaitPromise: true,
    })
    await command(context, 'Cancel')
  }
  await context.Workbench.evaluate({
    expression: `(() => { const p = globalThis.__failedHandoffProbe; p.mode = ''; p.beforeCompleted = p.completed })()`,
  })
  await command(context, 'Start')
  await command(context, 'Handoff')
  await waitForHandoff(context)
  await context.Workbench.evaluate({
    expression: `(() => {
    const p = globalThis.__failedHandoffProbe
    if (p.opened !== p.acquired || p.disposeCalls !== p.acquired || p.failed !== p.acquired - 1 || p.lastError) throw new Error('Successful handoff was not reached')
  })()`,
  })
  await context.Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      const check = () => {
        const model = globalThis.__failedHandoffProbe.records.at(-1)?.deref()
        const response = model?.getRequests().at(-1)?.response
        if (response?.isComplete) {
          if (response.result?.errorDetails) return reject(new Error('Recovery request failed: ' + response.result.errorDetails.message))
          return resolve(true)
        }
        if (Date.now() > deadline) return reject(new Error('Recovery handoff did not complete a response'))
        setTimeout(check, 50)
      }
      check()
    })`,
    awaitPromise: true,
  })
  await command(context, 'Verify')
  await context.ChatEditor.clearAll()
  await context.Workbench.evaluate({
    expression: `(async () => {
    const p = globalThis.__failedHandoffProbe
    await p.service.deref().waitForModelDisposals()
    if (p.records.some(record => { const model = record.deref(); return model && !model._store.isDisposed })) throw new Error('Handoff target remains live after chat cleanup')
    p.records = []
    p.acquired = p.disposeCalls = p.opened = p.failed = 0
  })()`,
    awaitPromise: true,
  })
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    await context.Workbench.evaluate({ expression: 'globalThis.__failedHandoffProbe?.restore()' })
  } finally {
    try {
      await context.ChatEditor.clearAll()
    } finally {
      await command(context, 'Cleanup')
    }
  }
}
