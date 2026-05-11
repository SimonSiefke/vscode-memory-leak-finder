declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

export * from './types/pageobject-api.d.ts'

export type { PageObjectApi as TestContext } from './types/pageobject-api.d.ts'
