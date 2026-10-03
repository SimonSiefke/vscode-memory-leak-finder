declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

export * from './types/pageobject-api.d.ts'

export type { default as TestContext } from './types/pageobject-api.d.ts'
