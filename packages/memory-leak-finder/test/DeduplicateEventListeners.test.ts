import { test, expect } from '@jest/globals'
import * as DeduplicateEventListeners from '../src/parts/DeduplicateEventListeners/DeduplicateEventListeners.ts'

test('deduplicateEventListeners', () => {
  const eventListeners = [
    {
      description: 'n=>{t.$_O.stop(n,!0)}',
      objectId: '-6797172934488280601.4.103220',
      sourceMaps: [
        'https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map',
      ],
      stack: ['listener (.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:18357)'],
      type: 'contextmenu',
    },
    {
      description: 'n=>{t.$_O.stop(n,!0)}',
      objectId: '-6797172934488280601.4.103234',
      sourceMaps: [
        'https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map',
      ],
      stack: ['listener (.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:18357)'],
      type: 'contextmenu',
    },
    {
      description: 'n=>{t.$_O.stop(n,!0)}',
      objectId: '-6797172934488280601.4.103248',
      sourceMaps: [
        'https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map',
      ],
      stack: ['listener (.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:18357)'],
      type: 'contextmenu',
    },
  ]
  expect(DeduplicateEventListeners.deduplicateEventListeners(eventListeners)).toEqual([
    {
      count: 3,
      description: 'n=>{t.$_O.stop(n,!0)}',
      objectId: '-6797172934488280601.4.103248',
      sourceMaps: [
        'https://ticino.blob.core.windows.net/sourcemaps/f1b07bd25dfad64b0167beb15359ae573aecd2cc/core/vs/workbench/workbench.desktop.main.js.map',
      ],
      stack: ['listener (.vscode-test/vscode-linux-x64-1.83.1/resources/app/out/vs/workbench/workbench.desktop.main.js:244:18357)'],
      type: 'contextmenu',
    },
  ])
})
