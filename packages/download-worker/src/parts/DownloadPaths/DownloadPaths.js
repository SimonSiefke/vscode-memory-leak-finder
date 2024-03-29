// copied from microsoft/playwright/packages/playwright-core/src/server/registry/index.ts (License Apache 2.0)

export const downloadPaths = {
  chromium: {
    '<unknown>': undefined,
    'generic-linux': 'builds/chromium/%s/chromium-linux.zip',
    'generic-linux-arm64': 'builds/chromium/%s/chromium-linux-arm64.zip',
    'ubuntu18.04': 'builds/chromium/%s/chromium-linux.zip',
    'ubuntu20.04': 'builds/chromium/%s/chromium-linux.zip',
    'ubuntu22.04': 'builds/chromium/%s/chromium-linux.zip',
    'ubuntu18.04-arm64': 'builds/chromium/%s/chromium-linux-arm64.zip',
    'ubuntu20.04-arm64': 'builds/chromium/%s/chromium-linux-arm64.zip',
    'ubuntu22.04-arm64': 'builds/chromium/%s/chromium-linux-arm64.zip',
    debian11: 'builds/chromium/%s/chromium-linux.zip',
    'debian11-arm64': 'builds/chromium/%s/chromium-linux-arm64.zip',
    debian12: 'builds/chromium/%s/chromium-linux.zip',
    'debian12-arm64': 'builds/chromium/%s/chromium-linux-arm64.zip',
    'mac10.13': 'builds/chromium/%s/chromium-mac.zip',
    'mac10.14': 'builds/chromium/%s/chromium-mac.zip',
    'mac10.15': 'builds/chromium/%s/chromium-mac.zip',
    mac11: 'builds/chromium/%s/chromium-mac.zip',
    'mac11-arm64': 'builds/chromium/%s/chromium-mac-arm64.zip',
    mac12: 'builds/chromium/%s/chromium-mac.zip',
    'mac12-arm64': 'builds/chromium/%s/chromium-mac-arm64.zip',
    mac13: 'builds/chromium/%s/chromium-mac.zip',
    'mac13-arm64': 'builds/chromium/%s/chromium-mac-arm64.zip',
    win64: 'builds/chromium/%s/chromium-win64.zip',
  },
  'chromium-tip-of-tree': {
    '<unknown>': undefined,
    'generic-linux': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip',
    'generic-linux-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip',
    'ubuntu18.04': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip',
    'ubuntu20.04': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip',
    'ubuntu22.04': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip',
    'ubuntu18.04-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip',
    'ubuntu20.04-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip',
    'ubuntu22.04-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip',
    debian11: 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip',
    'debian11-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip',
    debian12: 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux.zip',
    'debian12-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-linux-arm64.zip',
    'mac10.13': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip',
    'mac10.14': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip',
    'mac10.15': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip',
    mac11: 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip',
    'mac11-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip',
    mac12: 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip',
    'mac12-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip',
    mac13: 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac.zip',
    'mac13-arm64': 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-mac-arm64.zip',
    win64: 'builds/chromium-tip-of-tree/%s/chromium-tip-of-tree-win64.zip',
  },
  'chromium-with-symbols': {
    '<unknown>': undefined,
    'generic-linux': 'builds/chromium/%s/chromium-with-symbols-linux.zip',
    'generic-linux-arm64': 'builds/chromium/%s/chromium-with-symbols-linux-arm64.zip',
    'ubuntu18.04': 'builds/chromium/%s/chromium-with-symbols-linux.zip',
    'ubuntu20.04': 'builds/chromium/%s/chromium-with-symbols-linux.zip',
    'ubuntu22.04': 'builds/chromium/%s/chromium-with-symbols-linux.zip',
    'ubuntu18.04-arm64': 'builds/chromium/%s/chromium-with-symbols-linux-arm64.zip',
    'ubuntu20.04-arm64': 'builds/chromium/%s/chromium-with-symbols-linux-arm64.zip',
    'ubuntu22.04-arm64': 'builds/chromium/%s/chromium-with-symbols-linux-arm64.zip',
    debian11: 'builds/chromium/%s/chromium-with-symbols-linux.zip',
    'debian11-arm64': 'builds/chromium/%s/chromium-with-symbols-linux-arm64.zip',
    debian12: 'builds/chromium/%s/chromium-with-symbols-linux.zip',
    'debian12-arm64': 'builds/chromium/%s/chromium-with-symbols-linux-arm64.zip',
    'mac10.13': 'builds/chromium/%s/chromium-with-symbols-mac.zip',
    'mac10.14': 'builds/chromium/%s/chromium-with-symbols-mac.zip',
    'mac10.15': 'builds/chromium/%s/chromium-with-symbols-mac.zip',
    mac11: 'builds/chromium/%s/chromium-with-symbols-mac.zip',
    'mac11-arm64': 'builds/chromium/%s/chromium-with-symbols-mac-arm64.zip',
    mac12: 'builds/chromium/%s/chromium-with-symbols-mac.zip',
    'mac12-arm64': 'builds/chromium/%s/chromium-with-symbols-mac-arm64.zip',
    mac13: 'builds/chromium/%s/chromium-with-symbols-mac.zip',
    'mac13-arm64': 'builds/chromium/%s/chromium-with-symbols-mac-arm64.zip',
    win64: 'builds/chromium/%s/chromium-with-symbols-win64.zip',
  },
  firefox: {
    '<unknown>': undefined,
    'generic-linux': 'builds/firefox/%s/firefox-ubuntu-20.04.zip',
    'generic-linux-arm64': 'builds/firefox/%s/firefox-ubuntu-20.04-arm64.zip',
    'ubuntu18.04': 'builds/firefox/%s/firefox-ubuntu-18.04.zip',
    'ubuntu20.04': 'builds/firefox/%s/firefox-ubuntu-20.04.zip',
    'ubuntu22.04': 'builds/firefox/%s/firefox-ubuntu-22.04.zip',
    'ubuntu18.04-arm64': undefined,
    'ubuntu20.04-arm64': 'builds/firefox/%s/firefox-ubuntu-20.04-arm64.zip',
    'ubuntu22.04-arm64': 'builds/firefox/%s/firefox-ubuntu-22.04-arm64.zip',
    debian11: 'builds/firefox/%s/firefox-debian-11.zip',
    'debian11-arm64': 'builds/firefox/%s/firefox-debian-11-arm64.zip',
    debian12: 'builds/firefox/%s/firefox-debian-12.zip',
    'debian12-arm64': 'builds/firefox/%s/firefox-debian-12-arm64.zip',
    'mac10.13': 'builds/firefox/%s/firefox-mac-13.zip',
    'mac10.14': 'builds/firefox/%s/firefox-mac-13.zip',
    'mac10.15': 'builds/firefox/%s/firefox-mac-13.zip',
    mac11: 'builds/firefox/%s/firefox-mac-13.zip',
    'mac11-arm64': 'builds/firefox/%s/firefox-mac-13-arm64.zip',
    mac12: 'builds/firefox/%s/firefox-mac-13.zip',
    'mac12-arm64': 'builds/firefox/%s/firefox-mac-13-arm64.zip',
    mac13: 'builds/firefox/%s/firefox-mac-13.zip',
    'mac13-arm64': 'builds/firefox/%s/firefox-mac-13-arm64.zip',
    win64: 'builds/firefox/%s/firefox-win64.zip',
  },
  'firefox-beta': {
    '<unknown>': undefined,
    'generic-linux': 'builds/firefox-beta/%s/firefox-beta-ubuntu-20.04.zip',
    'generic-linux-arm64': undefined,
    'ubuntu18.04': 'builds/firefox-beta/%s/firefox-beta-ubuntu-18.04.zip',
    'ubuntu20.04': 'builds/firefox-beta/%s/firefox-beta-ubuntu-20.04.zip',
    'ubuntu22.04': 'builds/firefox-beta/%s/firefox-beta-ubuntu-22.04.zip',
    'ubuntu18.04-arm64': undefined,
    'ubuntu20.04-arm64': undefined,
    'ubuntu22.04-arm64': 'builds/firefox-beta/%s/firefox-beta-ubuntu-22.04-arm64.zip',
    debian11: 'builds/firefox-beta/%s/firefox-beta-debian-11.zip',
    'debian11-arm64': 'builds/firefox-beta/%s/firefox-beta-debian-11-arm64.zip',
    debian12: 'builds/firefox-beta/%s/firefox-beta-debian-12.zip',
    'debian12-arm64': 'builds/firefox-beta/%s/firefox-beta-debian-12-arm64.zip',
    'mac10.13': 'builds/firefox-beta/%s/firefox-beta-mac-13.zip',
    'mac10.14': 'builds/firefox-beta/%s/firefox-beta-mac-13.zip',
    'mac10.15': 'builds/firefox-beta/%s/firefox-beta-mac-13.zip',
    mac11: 'builds/firefox-beta/%s/firefox-beta-mac-13.zip',
    'mac11-arm64': 'builds/firefox-beta/%s/firefox-beta-mac-13-arm64.zip',
    mac12: 'builds/firefox-beta/%s/firefox-beta-mac-13.zip',
    'mac12-arm64': 'builds/firefox-beta/%s/firefox-beta-mac-13-arm64.zip',
    mac13: 'builds/firefox-beta/%s/firefox-beta-mac-13.zip',
    'mac13-arm64': 'builds/firefox-beta/%s/firefox-beta-mac-13-arm64.zip',
    win64: 'builds/firefox-beta/%s/firefox-beta-win64.zip',
  },
  'firefox-asan': {
    '<unknown>': undefined,
    'generic-linux': 'builds/firefox/%s/firefox-asan-ubuntu-20.04.zip',
    'generic-linux-arm64': undefined,
    'ubuntu18.04': undefined,
    'ubuntu20.04': undefined,
    'ubuntu22.04': 'builds/firefox/%s/firefox-asan-ubuntu-22.04.zip',
    'ubuntu18.04-arm64': undefined,
    'ubuntu20.04-arm64': undefined,
    'ubuntu22.04-arm64': undefined,
    debian11: undefined,
    'debian11-arm64': undefined,
    'mac10.13': 'builds/firefox/%s/firefox-asan-mac-13.zip',
    'mac10.14': 'builds/firefox/%s/firefox-asan-mac-13.zip',
    'mac10.15': 'builds/firefox/%s/firefox-asan-mac-13.zip',
    mac11: 'builds/firefox/%s/firefox-asan-mac-13.zip',
    'mac11-arm64': undefined,
    mac12: 'builds/firefox/%s/firefox-asan-mac-13.zip',
    'mac12-arm64': undefined,
    mac13: 'builds/firefox/%s/firefox-asan-mac-13.zip',
    'mac13-arm64': undefined,
    win64: undefined,
  },
  webkit: {
    '<unknown>': undefined,
    'generic-linux': 'builds/webkit/%s/webkit-ubuntu-20.04.zip',
    'generic-linux-arm64': 'builds/webkit/%s/webkit-ubuntu-20.04-arm64.zip',
    'ubuntu18.04': 'builds/deprecated-webkit-ubuntu-18.04/%s/deprecated-webkit-ubuntu-18.04.zip',
    'ubuntu20.04': 'builds/webkit/%s/webkit-ubuntu-20.04.zip',
    'ubuntu22.04': 'builds/webkit/%s/webkit-ubuntu-22.04.zip',
    'ubuntu18.04-arm64': undefined,
    'ubuntu20.04-arm64': 'builds/webkit/%s/webkit-ubuntu-20.04-arm64.zip',
    'ubuntu22.04-arm64': 'builds/webkit/%s/webkit-ubuntu-22.04-arm64.zip',
    debian11: 'builds/webkit/%s/webkit-debian-11.zip',
    'debian11-arm64': 'builds/webkit/%s/webkit-debian-11-arm64.zip',
    debian12: 'builds/webkit/%s/webkit-debian-12.zip',
    'debian12-arm64': 'builds/webkit/%s/webkit-debian-12-arm64.zip',
    'mac10.13': undefined,
    'mac10.14': 'builds/deprecated-webkit-mac-10.14/%s/deprecated-webkit-mac-10.14.zip',
    'mac10.15': 'builds/deprecated-webkit-mac-10.15/%s/deprecated-webkit-mac-10.15.zip',
    mac11: 'builds/webkit/%s/webkit-mac-11.zip',
    'mac11-arm64': 'builds/webkit/%s/webkit-mac-11-arm64.zip',
    mac12: 'builds/webkit/%s/webkit-mac-12.zip',
    'mac12-arm64': 'builds/webkit/%s/webkit-mac-12-arm64.zip',
    mac13: 'builds/webkit/%s/webkit-mac-13.zip',
    'mac13-arm64': 'builds/webkit/%s/webkit-mac-13-arm64.zip',
    win64: 'builds/webkit/%s/webkit-win64.zip',
  },
  ffmpeg: {
    '<unknown>': undefined,
    'generic-linux': 'builds/ffmpeg/%s/ffmpeg-linux.zip',
    'generic-linux-arm64': 'builds/ffmpeg/%s/ffmpeg-linux-arm64.zip',
    'ubuntu18.04': 'builds/ffmpeg/%s/ffmpeg-linux.zip',
    'ubuntu20.04': 'builds/ffmpeg/%s/ffmpeg-linux.zip',
    'ubuntu22.04': 'builds/ffmpeg/%s/ffmpeg-linux.zip',
    'ubuntu18.04-arm64': 'builds/ffmpeg/%s/ffmpeg-linux-arm64.zip',
    'ubuntu20.04-arm64': 'builds/ffmpeg/%s/ffmpeg-linux-arm64.zip',
    'ubuntu22.04-arm64': 'builds/ffmpeg/%s/ffmpeg-linux-arm64.zip',
    debian11: 'builds/ffmpeg/%s/ffmpeg-linux.zip',
    'debian11-arm64': 'builds/ffmpeg/%s/ffmpeg-linux-arm64.zip',
    debian12: 'builds/ffmpeg/%s/ffmpeg-linux.zip',
    'debian12-arm64': 'builds/ffmpeg/%s/ffmpeg-linux-arm64.zip',
    'mac10.13': 'builds/ffmpeg/%s/ffmpeg-mac.zip',
    'mac10.14': 'builds/ffmpeg/%s/ffmpeg-mac.zip',
    'mac10.15': 'builds/ffmpeg/%s/ffmpeg-mac.zip',
    mac11: 'builds/ffmpeg/%s/ffmpeg-mac.zip',
    'mac11-arm64': 'builds/ffmpeg/%s/ffmpeg-mac-arm64.zip',
    mac12: 'builds/ffmpeg/%s/ffmpeg-mac.zip',
    'mac12-arm64': 'builds/ffmpeg/%s/ffmpeg-mac-arm64.zip',
    mac13: 'builds/ffmpeg/%s/ffmpeg-mac.zip',
    'mac13-arm64': 'builds/ffmpeg/%s/ffmpeg-mac-arm64.zip',
    win64: 'builds/ffmpeg/%s/ffmpeg-win64.zip',
  },
  android: {
    '<unknown>': 'builds/android/%s/android.zip',
  },
}
