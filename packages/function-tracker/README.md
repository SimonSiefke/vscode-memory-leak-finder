# VS Code Function Call Tracker

A tool to track function calls in VS Code for performance analysis using Babel transformation and Chrome DevTools.

## How It Works

1. **Babel Transformation**: The script reads VS Code's `workbench.desktop.main.js` and transforms it using Babel to wrap every function call with a tracking function.

2. **Chrome DevTools Injection**: Using Puppeteer, we intercept requests to the original workbench script and serve our transformed version instead.

3. **Statistics Collection**: The tracking function records each function call in `globalThis.___functionStatistics` and provides utilities to query the data.

## Usage

### Step 1: Transform the VS Code code
```bash
cd packages/function-tracker
npm install
npm run transform
node src/apply-transform.js
```

This will:
- Read the original VS Code workbench file from `/home/simon/.cache/repos/vscode/out/vs/workbench/workbench.desktop.main.js`
- Transform it with function call tracking
- Save the result as `workbench.desktop.main.tracked.js`

### Step 2: Start the tracking system
```bash
npm run track
node src/devtools-injector.js
```

This will:
- Launch Chrome with remote debugging
- Set up request interception to inject the tracked code
- Start monitoring function calls
- Print statistics every 10 seconds

### Step 3: Use VS Code
- Interact with VS Code normally
- Function calls will be tracked automatically
- Press Ctrl+C to stop tracking and see final statistics

## Output Example

```
=== Function Call Statistics ===
registerSingleton: 45 calls
createInstance: 123 calls
getService: 89 calls
main: 1 calls
trackFunctionCall: 567 calls

Total functions tracked: 234
Total function calls: 1,234
```

## API

### VSCodeFunctionTracker Class

```javascript
import { VSCodeFunctionTracker } from '@vscode-memory-leak-finder/function-tracker'

const tracker = new VSCodeFunctionTracker()
await tracker.initialize()
await tracker.loadVSCode()
const stats = await tracker.getFunctionStatistics()
await tracker.printStatistics()
```

### Transform Code Directly

```javascript
import { transformCode } from '@vscode-memory-leak-finder/function-tracker'

const originalCode = 'function test() { return 42 }'
const transformedCode = transformCode(originalCode, 'test.js')
```

## Files

- `src/transform-script.js`: Babel transformation logic
- `src/apply-transform.js`: Applies transformation to VS Code code
- `src/devtools-injector.js`: Chrome DevTools integration
- `src/index.js`: Main exports
- `workbench.desktop.main.tracked.js`: Transformed VS Code code (generated)

## Customization

You can modify the transformation in `transform-script.js` to:
- Track specific functions only
- Add timing information
- Filter by module or location
- Change the statistics collection format

## Notes

- The tracking adds some overhead, so performance measurements should account for this
- Large codebases may generate significant amounts of tracking data
- The system works best with VS Code running as a web app or with remote debugging enabled
