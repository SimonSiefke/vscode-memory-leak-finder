import { test, expect } from '@jest/globals'
import * as PrettifyInstanceCounts from '../src/parts/PrettifyInstanceCounts/PrettifyInstanceCounts.ts'

test.skip('prettifyInstanceCounts', () => {
  const instanceCounts = [
    {
      columnNumber: 3728,
      count: 6490,
      lineNumber: 0,
      name: 'm',
      scriptId: '14',
      sourceMapUrl:
        'https://example.com/sourcemaps/2b35e1e6d88f1ce073683991d1eff5284a32690f/core/vs/code/electron-sandbox/workbench/workbench.js.map',
      url: '/test/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.84.1/resources/app/out/vs/code/electron-sandbox/workbench/workbench.js',
    },
    {
      columnNumber: 0,
      count: 4443,
      lineNumber: 0,
      name: 'AsyncFunction',
      scriptId: '',
      sourceMapUrl: '',
      url: '',
    },
    {
      columnNumber: 27_354,
      count: 4416,
      lineNumber: 19,
      name: 't',
      scriptId: '16',
      sourceMapUrl:
        'https://example.com/sourcemaps/2b35e1e6d88f1ce073683991d1eff5284a32690f/core/vs/workbench/workbench.desktop.main.js.map',
      url: '/test/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.84.1/resources/app/out/vs/workbench/workbench.desktop.main.js',
    },
  ]
  expect(PrettifyInstanceCounts.prettifyInstanceCounts(instanceCounts)).toEqual([])
})
