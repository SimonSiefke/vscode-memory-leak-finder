import { beforeEach, expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { monkeyPatchElectronIpcMain } from '../src/parts/MonkeyPatchElectronScript/MonkeyPatchElectronIpcMain.ts'

beforeEach(() => {
  delete (globalThis as any).__ipcMessages
  delete (globalThis as any).__vscodeMemoryLeakFinderIpcMainPatched
})

const runMonkeyPatch = (electron: any): void => {
  const fn = Function(`return (${monkeyPatchElectronIpcMain})`)()
  fn.call(electron)
}

const getMessages = (): any[] => {
  return (globalThis as any).__ipcMessages
}

const createWebContents = (overrides: any = {}) => {
  const calls: any[] = []
  const contents = {
    id: 7,
    getOSProcessId: () => 4321,
    getProcessId: () => 1234,
    getTitle: () => 'Workbench',
    getType: () => 'window',
    getURL: () => 'vscode-file://vscode-app/workbench.html',
    postMessage: (channel: string, message: any, transfer?: any) => {
      calls.push({ channel, message, method: 'postMessage', transfer })
    },
    send: (channel: string, ...args: any[]) => {
      calls.push({ args, channel, method: 'send' })
    },
    sendToFrame: (frameId: number, channel: string, ...args: any[]) => {
      calls.push({ args, channel, frameId, method: 'sendToFrame' })
    },
    ...overrides,
  }
  return { calls, contents }
}

const createElectron = (contents: any[] = []) => {
  const ipcListeners = Object.create(null)
  const ipcHandlers = Object.create(null)
  const appListeners = Object.create(null)
  const removeIpcListener = (channel: string, listener: any) => {
    if (ipcListeners[channel] === listener) {
      delete ipcListeners[channel]
    }
  }
  const electron = {
    app: {
      on: (event: string, listener: any) => {
        appListeners[event] = listener
      },
    },
    ipcMain: {
      handle: (channel: string, listener: any) => {
        ipcHandlers[channel] = listener
      },
      on: (channel: string, listener: any) => {
        ipcListeners[channel] = listener
      },
      off: removeIpcListener,
      removeListener: removeIpcListener,
    },
    webContents: {
      getAllWebContents: () => contents,
    },
  }
  return { appListeners, electron, ipcHandlers, ipcListeners }
}

for (const method of ['removeListener', 'off'] as const) {
  test(`monkeyPatchElectronIpcMain preserves listener identity for ipcMain.${method}`, () => {
    const { electron, ipcListeners } = createElectron()
    runMonkeyPatch(electron)
    const listener = () => {}

    electron.ipcMain.on('test', listener)
    electron.ipcMain[method]('test', listener)

    expect(ipcListeners.test).toBeUndefined()
  })
}

test('monkeyPatchElectronIpcMain preserves listener identity for ipcMain.once', () => {
  const { electron } = createElectron()
  const ipcMain = new EventEmitter() as any
  ipcMain.handle = electron.ipcMain.handle
  electron.ipcMain = ipcMain
  runMonkeyPatch(electron)
  const listener = () => {}

  ipcMain.once('test', listener)
  ipcMain.removeListener('test', listener)

  expect(ipcMain.listenerCount('test')).toBe(0)
})

test('monkeyPatchElectronIpcMain records renderer-to-main endpoints for ipcMain.on', () => {
  const { contents } = createWebContents()
  const { electron, ipcListeners } = createElectron([contents])
  runMonkeyPatch(electron)
  electron.ipcMain.on('test', () => {})

  ipcListeners.test(
    {
      frameId: 9,
      processId: 1234,
      sender: contents,
      senderFrame: {
        url: 'vscode-file://vscode-app/workbench.html',
      },
    },
    'arg1',
  )

  expect(getMessages()).toHaveLength(1)
  expect(getMessages()[0]).toMatchObject({
    args: ['"arg1"'],
    channel: 'test',
    direction: 'renderer-to-main',
    from: {
      frameId: 9,
      frameUrl: 'vscode-file://vscode-app/workbench.html',
      kind: 'renderer',
      label: 'browser-window',
      osProcessId: 4321,
      processId: 1234,
      title: 'Workbench',
      type: 'window',
      url: 'vscode-file://vscode-app/workbench.html',
      webContentsId: 7,
    },
    to: {
      kind: 'electron-main',
      label: 'electron-main',
      pid: process.pid,
    },
    type: 'on',
  })
})

test('monkeyPatchElectronIpcMain records handle request and response endpoints', async () => {
  const { contents } = createWebContents()
  const { electron, ipcHandlers } = createElectron([contents])
  runMonkeyPatch(electron)
  electron.ipcMain.handle('invoke', async () => {})

  await expect(
    ipcHandlers.invoke(
      {
        frameId: 3,
        processId: 222,
        sender: contents,
      },
      'request',
    ),
  ).resolves.toBeUndefined()

  expect(getMessages()).toHaveLength(2)
  expect(getMessages()[0]).toMatchObject({
    channel: 'invoke',
    direction: 'renderer-to-main',
    from: {
      frameId: 3,
      processId: 222,
      webContentsId: 7,
    },
    type: 'handle-request',
  })
  expect(getMessages()[1]).toMatchObject({
    channel: 'invoke',
    direction: 'main-to-renderer',
    from: {
      kind: 'electron-main',
      pid: process.pid,
    },
    to: {
      frameId: 3,
      processId: 222,
      webContentsId: 7,
    },
    type: 'handle-response',
  })
})

test('monkeyPatchElectronIpcMain records handle error endpoints', async () => {
  const { contents } = createWebContents()
  const { electron, ipcHandlers } = createElectron([contents])
  runMonkeyPatch(electron)

  electron.ipcMain.handle('fail', async () => {
    throw new Error('boom')
  })

  await expect(
    ipcHandlers.fail({
      frameId: 3,
      processId: 222,
      sender: contents,
    }),
  ).rejects.toThrow('boom')

  expect(getMessages()[1]).toMatchObject({
    channel: 'fail',
    direction: 'main-to-renderer',
    error: 'boom',
    to: {
      frameId: 3,
      processId: 222,
      webContentsId: 7,
    },
    type: 'handle-error',
  })
})

test('monkeyPatchElectronIpcMain records webContents.send destination and calls original method', () => {
  const { calls, contents } = createWebContents()
  const { electron } = createElectron([contents])
  runMonkeyPatch(electron)

  contents.send('outbound', { ok: true })

  expect(calls).toEqual([{ args: [{ ok: true }], channel: 'outbound', method: 'send' }])
  expect(getMessages()).toHaveLength(1)
  expect(getMessages()[0]).toMatchObject({
    args: ['{"ok":true}'],
    channel: 'outbound',
    direction: 'main-to-renderer',
    from: {
      kind: 'electron-main',
      pid: process.pid,
    },
    to: {
      kind: 'renderer',
      label: 'browser-window',
      webContentsId: 7,
    },
    type: 'webContents.send',
  })
})

test('monkeyPatchElectronIpcMain patches future webContents instances', () => {
  const { appListeners, electron } = createElectron()
  runMonkeyPatch(electron)

  const { calls, contents } = createWebContents({ id: 8 })
  appListeners['web-contents-created']({}, contents)
  contents.send('later', 'value')

  expect(calls).toEqual([{ args: ['value'], channel: 'later', method: 'send' }])
  expect(getMessages()[0]).toMatchObject({
    channel: 'later',
    to: {
      webContentsId: 8,
    },
    type: 'webContents.send',
  })
})

test('monkeyPatchElectronIpcMain tolerates destroyed sender frame metadata', () => {
  const { contents } = createWebContents({
    getOSProcessId: () => {
      throw new Error('destroyed')
    },
    getTitle: () => {
      throw new Error('destroyed')
    },
  })
  const { electron, ipcListeners } = createElectron([contents])
  runMonkeyPatch(electron)
  electron.ipcMain.on('test', () => {})

  ipcListeners.test({
    frameId: 4,
    processId: 555,
    sender: contents,
    senderFrame: {
      get url() {
        throw new Error('destroyed')
      },
    },
  })

  expect(getMessages()[0]).toMatchObject({
    direction: 'renderer-to-main',
    from: {
      frameId: 4,
      kind: 'renderer',
      processId: 555,
      webContentsId: 7,
    },
    type: 'on',
  })
})
