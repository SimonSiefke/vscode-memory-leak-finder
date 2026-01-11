declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

export * from './types/pageobject-api.d.ts'

import Api from './types/pageobject-api.d.ts'

export { Api as TestContext }
