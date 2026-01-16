// Test to reproduce user's case
import { getSourceMapUrlMap } from './packages/memory-leak-finder/src/parts/GetSourceMapUrlMap/GetSourceMapUrlMap.ts';
import { combineEventListenersWithSourceMapResults } from './packages/memory-leak-finder/src/parts/CombineEventListenersWithSourceMapResults/CombineEventListenersWithSourceMapResults.ts';

// Simulate user's case
const eventListeners = [
  {
    stack: [
      "listener (file:///home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:426:55161)",
      "new o_i (vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:35:2233)",
      "Y (vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:35:2394)",
      "new f8t (vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:427:55145)",
      "new vas (vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:427:56057)",
      "Hp.render (vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:427:57665)",
      "vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:421:19658)",
      "Array.forEach (<anonymous>)",
      "bs.push (vscode-file://vscode-app/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js:421:19227)"
    ],
    sourceMaps: ['workbench.desktop.main.js.map'], // Assuming same source map for all lines
  }
];

console.log('Input event listener:');
console.log(JSON.stringify(eventListeners, null, 2));

const map = getSourceMapUrlMap(eventListeners);
console.log('Generated map:');
console.log(JSON.stringify(map, null, 2));

// Mock cleanPositionMap (would normally come from source map processing)
const cleanPositionMap = {
  'workbench.desktop.main.js.map': [
    // These would be the cleaned positions from source maps
    // For now, just mock some entries to test
    { source: 'src/vs/base/browser/dom.ts', line: 1240, column: 69, name: 'addEventListener' },
    { source: 'src/vs/base/common/event.ts', line: 567, column: 123, name: 'createEvent' },
    { source: 'src/vs/base/common/lifecycle.ts', line: 234, column: 567, name: 'dispose' },
    // ... more entries for other lines
  ]
};

const result = combineEventListenersWithSourceMapResults(eventListeners, map, cleanPositionMap);
console.log('Result:');
console.log(JSON.stringify(result, null, 2));
