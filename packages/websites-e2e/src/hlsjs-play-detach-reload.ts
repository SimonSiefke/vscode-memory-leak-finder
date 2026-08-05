import type { TestContext } from '../types.js'

export const requiresNetwork = true

export const skip = true

const url =
  'https://hlsjs.video-dev.org/demo/?src=https%3A%2F%2Fplayertest.longtailvideo.com%2Fadaptive%2Fvod-with-mp3%2Fmanifest.m3u8&demoConfig=eyJlbmFibGVTdHJlYW1pbmciOnRydWUsImF1dG9SZWNvdmVyRXJyb3IiOnRydWUsInN0b3BPblN0YWxsIjpmYWxzZSwiZHVtcGZNUDQiOmZhbHNlLCJsZXZlbENhcHBpbmciOi0xLCJsaW1pdE1ldHJpY3MiOjUwfQ=='
const urlPattern = /^https:\/\/hlsjs\.video-dev\.org\/demo\//

const readyExpression = `(async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const start = Date.now()
  while (Date.now() - start < 60000) {
    const video = document.querySelector('video')
    if (video instanceof HTMLVideoElement && globalThis.hls?.media === video) {
      globalThis.hls.autoLevelCapping = 0
      globalThis.hls.nextLevel = 0
      if (!globalThis.hls.loadingEnabled) globalThis.hls.startLoad()
    }
    if (video instanceof HTMLVideoElement && video.readyState >= 1 && globalThis.hls?.media === video && globalThis.hls.levels?.length > 0) return
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
  const playPromise = video.play()
  const start = Date.now()
  while (Date.now() - start < 15000 && (video.paused || video.currentTime <= initialTime)) {
    await delay(100)
  }
  if (video.paused || video.currentTime <= initialTime) {
    throw new Error(\`Expected HLS.js playback to advance. readyState=\${video.readyState}; networkState=\${video.networkState}; currentTime=\${video.currentTime}; initialTime=\${initialTime}; buffered=\${video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0}; videoError=\${video.error?.message || '<none>'}; h264=\${video.canPlayType('video/mp4; codecs="avc1.42E01E"')}; levels=\${globalThis.hls.levels?.length}; loadLevel=\${globalThis.hls.loadLevel}\`)
  }
  await playPromise
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
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 65_000 })
}

export const run = async ({ SimpleBrowser }: TestContext): Promise<void> => {
  await SimpleBrowser.executeJavaScript({ expression: runExpression, timeout: 35_000 })
  await SimpleBrowser.navigateIntegratedBrowser({ url, waitForContentFrame: true })
  await SimpleBrowser.shouldHaveText({ selector: 'h2', text: 'demo', timeout: 20_000, urlPattern })
  await SimpleBrowser.executeJavaScript({ expression: readyExpression, timeout: 65_000 })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
