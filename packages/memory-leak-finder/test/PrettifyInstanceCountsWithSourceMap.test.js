import * as PrettifyInstanceCounts from '../src/parts/PrettifyInstanceCounts/PrettifyInstanceCounts.js'

test.skip('prettifyInstanceCounts', () => {
  const instanceCounts = [
    {
      name: 'm',
      count: 6490,
      scriptId: '14',
      lineNumber: 0,
      columnNumber: 3728,
      url: '/test/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.84.1/resources/app/out/vs/code/electron-sandbox/workbench/workbench.js',
      sourceMapUrl:
        'https://example.com/sourcemaps/2b35e1e6d88f1ce073683991d1eff5284a32690f/core/vs/code/electron-sandbox/workbench/workbench.js.map',
    },
    {
      name: 'AsyncFunction',
      count: 4443,
      scriptId: '',
      lineNumber: 0,
      columnNumber: 0,
      url: '',
      sourceMapUrl: '',
    },
    {
      name: 't',
      count: 4416,
      scriptId: '16',
      lineNumber: 19,
      columnNumber: 27354,
      url: '/test/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.84.1/resources/app/out/vs/workbench/workbench.desktop.main.js',
      sourceMapUrl:
        'https://example.com/sourcemaps/2b35e1e6d88f1ce073683991d1eff5284a32690f/core/vs/workbench/workbench.desktop.main.js.map',
    },
  ]
  expect(PrettifyInstanceCounts.prettifyInstanceCounts(instanceCounts)).toEqual([])
})
