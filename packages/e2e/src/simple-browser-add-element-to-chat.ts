import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Electron, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SimpleBrowser.createMockServer({
    id: 'simple-browser-show',
    port: 3001,
  })
  await SimpleBrowser.show({
    port: 3001,
  })

  // @ts-ignore
  await Electron.mockWebViewDebugger({
    // @ts-ignore
    async 'Overlay.inspectNodeRequested'(emitter) {
      await emitter.emit('Overlay.inspectNodeRequested')
      return {
        backendNodeId: 1234,
      }
    },
    //  TODO
  })
}

export const run = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.addElementToChat({
    selector: 'h1',
  })
  // TODO in order to mock selected node,
  // do it like this
  // 1. find all instances of webview Debugger
  // 2. filter to find the one matching the simple browser
  // 3. overwrite debugger.prototype.sendCommand and when it is called, send a fake inspectNoderequested event
  // 4. undo the mocks from 3.
  await Editor.closeAll()
}

export const teardown = async ({ Editor, SimpleBrowser }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SimpleBrowser.disposeMockServer({
    id: 'simple-browser-show',
  })
}
