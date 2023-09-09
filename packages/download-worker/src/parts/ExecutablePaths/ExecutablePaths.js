// copied from microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)

export const executablePaths = {
  chromium: {
    linux: ['chrome-linux', 'chrome'],
    mac: ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'],
    win: ['chrome-win', 'chrome.exe'],
  },
  firefox: {
    linux: ['firefox', 'firefox'],
    mac: ['firefox', 'Nightly.app', 'Contents', 'MacOS', 'firefox'],
    win: ['firefox', 'firefox.exe'],
  },
  webkit: {
    linux: ['pw_run.sh'],
    mac: ['pw_run.sh'],
    win: ['Playwright.exe'],
  },
  ffmpeg: {
    linux: ['ffmpeg-linux'],
    mac: ['ffmpeg-mac'],
    win: ['ffmpeg-win64.exe'],
  },
}
