# VSCode Memory Leak Finder

Find memory leaks in vscode to improve robustness and performance.

## Quickstart

```sh
git clone git@github.com:SimonSiefke/vscode-memory-leak-finder.git &&
cd vscode-memory-leak-finder &&
npm ci &&
npm run e2e
```

## Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/SimonSiefke/vscode-memory-leak-finder)

## Project Structure

- packages/cli: Command Line Interface, similar to jest
- packages/devtools-protocol: Functionality related to Chrome Devtools Protocol
- packages/e2e: The e2e test scenarios
- packages/file-watcher-worker: Watch files for changes
- packages/injected-code: Code injected to the page for e2e tests
- packages/memory-leak-finder: Library for finding memory leaks
- packages/memory-leak-worker: Process for finding memory leaks (uses the library from above)
- packages/page-object: Page Object Model to simplify e2e tests
- packages/test-coordinator: Determines which tests to run, launches VSCode, file-watcher-worker, test-worker, memory-leak-worker, video-recording-worker
- packages/test-worker: Runs tests
- packages/test-worker-commands: Functions used by test-worker
- packages/video-recording-worker: Record screencasts of the tests

## Memory Leaks

| Component            | Issue                                             | Status |
| -------------------- | ------------------------------------------------- | ------ |
| Menu                 | https://github.com/microsoft/vscode/issues/195580 | Fixed  |
| Dropdown             | https://github.com/microsoft/vscode/issues/197767 | Fixed  |
| MenuBar              | https://github.com/microsoft/vscode/issues/198051 | Review |
| DefaultWorkerFactory | https://github.com/microsoft/vscode/issues/198709 | Review |

## Credits

This project is based on the [jest cli](https://github.com/jestjs/jest), [playwright](https://github.com/microsoft/playwright/) and [fuite](https://github.com/nolanlawson/fuite).
