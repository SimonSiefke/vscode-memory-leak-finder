# test-coordinator

This process is responsible for launching the application in debug mode, reading the debugger websocket url from stdout and determining which test files to run.

After the application has been launched, and the test files have been determined, the test-coordinator launches the test-worker. Then the test-coordinator sends the debug websocket url to the test-worker. When the test worker is connected to vscode using a websocket, the test coordinator asks the test-worker to run the tests.

```
cli
├─ test-coordinator
│  ├─ vscode
│  ├─ test-worker
│  ├─ file-watcher-worker
```
