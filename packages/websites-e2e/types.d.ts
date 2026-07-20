declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

export * from '../e2e/types/pageobject-api.d.ts'

export type { default as TestContext } from '../e2e/types/pageobject-api.d.ts'
