import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, SimpleBrowser }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Integrated Browser Selected Element Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Selected Element Disposal: setup complete')
    await SimpleBrowser.showModern({ url: 'http://127.0.0.1:49234' })
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ SimpleBrowser, Workbench, QuickPick, Notification }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({
    expression: `if (!document.querySelector('#lifecycle')) { const element = document.createElement('a'); element.id = 'lifecycle'; element.href = '#selected'; element.textContent = 'Selected lifecycle element'; document.body.append(element); }`,
  })
  await Notification.closeAll({ force: true })
  await QuickPick.executeCommand('Integrated Browser Selected Element Disposal: Run')
  await Notification.shouldHaveItem('Integrated Browser Selected Element Disposal: run complete')
  await Notification.closeAll({ force: true })
  // The runtime page object exposes the modern browser click; its public type is older.
  await (
    SimpleBrowser as typeof SimpleBrowser & { clickBrowserWebContentsLink(options: { selector: string }): Promise<void> }
  ).clickBrowserWebContentsLink({ selector: '#lifecycle' })
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => { const deadline = Date.now() + 7000; const check = () => { if (document.querySelector('.chat-attached-context [aria-label^="Remove from context"]')) resolve(true); else if (Date.now() > deadline) reject(new Error('Selected element attachment missing')); else setTimeout(check, 50); }; check(); })`,
    awaitPromise: true,
  })
  await Workbench.evaluate({
    expression: `(() => {
    const remove = document.querySelector('.chat-attached-context [aria-label^="Remove from context"]');
    if (!remove) throw new Error('Element attachment remove button missing'); remove.click();
  })()`,
  })
  const count = await Workbench.evaluate({
    expression: `document.querySelectorAll('.chat-attached-context [aria-label^="Attached context,"]').length`,
  })
  if (count !== 0) throw new Error('Selected element attachment was not removed')
  await SimpleBrowser.executeJavaScript({ expression: "document.querySelector('#lifecycle').remove()" })
}

export const teardown = async ({ Notification, QuickPick, Editor }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await Editor.closeAll()
    await QuickPick.executeCommand('Integrated Browser Selected Element Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Selected Element Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
