# Python development

Eleven opt-in scenarios exercise the real Python and Pylance extensions. The Flask scenarios also explicitly install and enable Python Debugger.

| Scenario                                    | Measured iteration                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `terminal-python-run-file`                  | Open a project file, invoke **Python: Run Python File in Terminal**, verify the calculation and virtual-environment interpreter, then close the file and terminal.                                                                                           |
| `editor-python-project-completion`          | Open a client of another project module, type a member access, accept Pylance's method completion, verify the inserted expression, then discard the scratch edit and close the file.                                                                         |
| `terminal-python-pip-install`               | Keep a Flask module open while a terminal runs pip to reinstall Flask and its dependencies from a local wheelhouse, verify an imported Flask app returns the expected JSON, then close the file and terminal.                                                |
| `debug-python-flask-request`                | Launch a Flask WSGI server with Python Debugger, send a real HTTP request from a terminal, pause inside the route, inspect its local values in the Debug Console, continue and verify the response, then stop the server and close its editors and terminal. |
| `terminal-python-activation-lifecycle`      | Enable environment activation, create a Python terminal, verify the selected virtual-environment interpreter and calculation, then close the terminal.                                                                                                       |
| `terminal-python-repl-lifecycle`            | Start the Python terminal REPL, execute a calculation, verify its output, then close the terminal and editor.                                                                                                                                                |
| `terminal-python-create-lifecycle`          | Invoke **Python: Create Terminal**, run a project script, verify its fresh result and interpreter, then close the terminal and editor.                                                                                                                       |
| `editor-python-language-server-lifecycle`   | Switch the configured Python language server from Pylance to None and back, verify the server restarts, accept a real Pylance completion, then close the editor.                                                                                             |
| `notebook-python-native-repl-lifecycle`     | Open the Native REPL notebook, verify its Python kernel, execute a calculation and check the output, then close the notebook.                                                                                                                                |
| `testing-python-unittest-refresh`           | Edit and save a unittest module, refresh test discovery, require a fresh discovery marker, run the test and verify its passing result, then clear the results and close the editor.                                                                          |
| `editor-python-testing-workspace-lifecycle` | Add a configured workspace folder, edit and save a unittest module, verify fresh discovery, then close the file and remove the folder while the main workspace stays open.                                                                                   |

Use an official VS Code build, marketplace access, and Python 3.10 or newer with `venv` and `ensurepip`. Set `PYTHON_E2E_PYTHON` to an executable path to choose a particular host interpreter. The scenarios create a private `.venv` in the harness workspace, configure Python to use it, and remove it during teardown. They do not install packages into the host Python environment.

Flask setup downloads Flask and its dependencies, all pinned in `requirements.txt`, into `.wheels`, then installs them into the private environment. Measured pip iterations use only that wheelhouse with `--no-index --force-reinstall`, so each iteration exercises a real install with the same packages. PyPI access is needed during setup. The Flask server binds only to loopback on an OS-assigned port and uses no reloader; its actual port is passed to the terminal client through a fresh readiness file.

Assertions check actual terminal output and JSON results. Terminal commands contain script paths rather than the success messages, so echoed command text cannot satisfy the output checks. Result and readiness files are removed before reuse, preventing an earlier iteration from satisfying a later check. Debugger completion, HTTP responses, terminal output, and file creation provide the synchronization signals; the scenarios use no fixed sleeps.

Run all eleven scenarios with:

```sh
for scenario in terminal-python-run-file terminal-python-pip-install editor-python-project-completion debug-python-flask-request terminal-python-activation-lifecycle terminal-python-repl-lifecycle terminal-python-create-lifecycle editor-python-language-server-lifecycle notebook-python-native-repl-lifecycle testing-python-unittest-refresh editor-python-testing-workspace-lifecycle; do
  node packages/cli/bin/test.js --cwd packages/e2e --only "$scenario" --runs 3 --enable-extensions --run-skipped-tests-anyway --run-network-tests-anyway || break
done
```

For renderer measurements, replace `--runs 3` with `--runs 17` and add `--check-leaks --measure-after --measure named-function-count3`. Add `--inspect-extensions` for a separate extension-host run. Run these checks sequentially. Pylance's separate language-server process requires its own process inspection; it is not included in the extension-host heap.

The scenarios are skipped by default and marked `requiresNetwork` because they install marketplace extensions and the Flask cases download packages during setup. A repeated run retains the environment and installed extensions but closes the resources created by each measured iteration.

The lifecycle scenarios keep one extension-host session across iterations. The unittest scenario uses the standard-library test runner and verifies both a fresh result file and the Test Explorer summary. Source-built Python extensions must include the vendored dependencies installed by the repository’s `nox --session install_python_libs` build step.

The workspace scenario keeps two setup folders open while adding and removing a third folder. Its explicit save-discovery pattern includes the harness’s hidden workspace directories.
