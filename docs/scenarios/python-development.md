# Python development

Four opt-in scenarios exercise the real Python and Pylance extensions. The Flask scenarios also explicitly install and enable Python Debugger.

| Scenario                           | Measured iteration                                                                                                                                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `terminal-python-run-file`         | Open a project file, invoke **Python: Run Python File in Terminal**, verify the calculation and virtual-environment interpreter, then close the file and terminal.                                                                                           |
| `editor-python-project-completion` | Open a client of another project module, type a member access, accept Pylance's method completion, verify the inserted expression, then discard the scratch edit and close the file.                                                                         |
| `terminal-python-pip-install`      | Keep a Flask module open while a terminal runs pip to reinstall Flask and its dependencies from a local wheelhouse, verify an imported Flask app returns the expected JSON, then close the file and terminal.                                                |
| `debug-python-flask-request`       | Launch a Flask WSGI server with Python Debugger, send a real HTTP request from a terminal, pause inside the route, inspect its local values in the Debug Console, continue and verify the response, then stop the server and close its editors and terminal. |

Use an official VS Code build, marketplace access, and Python 3.10 or newer with `venv` and `ensurepip`. Set `PYTHON_E2E_PYTHON` to an executable path to choose a particular host interpreter. The scenarios create a private `.venv` in the harness workspace, configure Python to use it, and remove it during teardown. They do not install packages into the host Python environment.

Flask setup downloads Flask and its dependencies, all pinned in `requirements.txt`, into `.wheels`, then installs them into the private environment. Measured pip iterations use only that wheelhouse with `--no-index --force-reinstall`, so each iteration exercises a real install with the same packages. PyPI access is needed during setup. The Flask server binds only to loopback on an OS-assigned port and uses no reloader; its actual port is passed to the terminal client through a fresh readiness file.

Assertions check actual terminal output and JSON results. Terminal commands contain script paths rather than the success messages, so echoed command text cannot satisfy the output checks. Result and readiness files are removed before reuse, preventing an earlier iteration from satisfying a later check. Debugger completion, HTTP responses, terminal output, and file creation provide the synchronization signals; the scenarios use no fixed sleeps.

Run all four scenarios with:

```sh
for scenario in terminal-python-run-file terminal-python-pip-install editor-python-project-completion debug-python-flask-request; do
  node packages/cli/bin/test.js --cwd packages/e2e --only "$scenario" --runs 3 --enable-extensions --run-skipped-tests-anyway --run-network-tests-anyway || break
done
```

For renderer measurements, replace `--runs 3` with `--runs 17` and add `--check-leaks --measure-after --measure named-function-count3`. Add `--inspect-extensions` for a separate extension-host run. Run these checks sequentially. Pylance's separate language-server process requires its own process inspection; it is not included in the extension-host heap.

The scenarios are skipped by default and marked `requiresNetwork` because they install marketplace extensions and the Flask cases download packages during setup. A repeated run retains the environment and installed extensions but closes the resources created by each measured iteration.
