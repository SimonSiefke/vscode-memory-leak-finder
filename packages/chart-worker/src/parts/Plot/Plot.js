import { JSDOM } from 'jsdom'

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`)
// @ts-ignore
globalThis.window = dom.window
globalThis.document = dom.window.document

export * from '@observablehq/plot'
