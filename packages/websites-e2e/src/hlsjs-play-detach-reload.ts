import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url =
  'https://hlsjs.video-dev.org/demo/?src=https%3A%2F%2Ftest-streams.mux.dev%2Fx36xhzz%2Fx36xhzz.m3u8&demoConfig=eyJlbmFibGVTdHJlYW1pbmciOnRydWUsImF1dG9SZWNvdmVyRXJyb3IiOnRydWUsInN0b3BPblN0YWxsIjpmYWxzZSwiZHVtcGZNUDQiOmZhbHNlLCJsZXZlbENhcHBpbmciOi0xLCJsaW1pdE1ldHJpY3MiOjUwfQ=='
const urlPattern = /^https:\/\/hlsjs\.video-dev\.org\/demo\//

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 30000) {
    const video = document.querySelector('video')
    if (video instanceof HTMLVideoElement && video.readyState >= 2 && globalThis.hls?.media === video) return
    await delay(100)
  }
  const video = document.querySelector('video')
  throw new Error(\`Timed out waiting for HLS.js media. url=\${location.href}; readyState=\${video?.readyState}; hlsMedia=\${Boolean(globalThis.hls?.media)}\`)
})()`

const runExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const video = document.querySelector('video')
  if (!(video instanceof HTMLVideoElement) || !globalThis.hls) {
    throw new Error(\`Expected HLS.js video and controller. url=\${location.href}\`)
  }
  video.muted = true
  const initialTime = video.currentTime
  await video.play()
  const start = Date.now()
  while (Date.now() - start < 15000 && (video.paused || video.currentTime <= initialTime)) {
    await delay(100)
  }
  if (video.paused || video.currentTime <= initialTime) {
    throw new Error(\`Expected HLS.js playback to advance. readyState=\${video.readyState}; currentTime=\${video.currentTime}; initialTime=\${initialTime}\`)
  }
  video.pause()
  if (!video.paused) throw new Error('Expected HLS.js video to pause')
  globalThis.hls.stopLoad()
  globalThis.hls.detachMedia()
  const detachStart = Date.now()
  while (Date.now() - detachStart < 10000 && globalThis.hls.media) {
    await delay(100)
  }
  if (globalThis.hls.media) throw new Error('Expected HLS.js media to detach')
})()`

export const setup = async ({ Editor, Notification, SideBar, SimpleBrowser, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await SideBar.hide()
  await Notification.closeAll({ force: true })
  await SimpleBrowser.show({ url })
  await SimpleBrowser.shouldHaveText({ selector: 'h2', text: 'demo', timeout: 20_000, urlPattern })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 35_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression: runExpression, timeout: 35_000 })
  await SimpleBrowser.navigateIntegratedBrowser({ url, waitForContentFrame: true })
  await SimpleBrowser.shouldHaveText({ selector: 'h2', text: 'demo', timeout: 20_000, urlPattern })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 35_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
