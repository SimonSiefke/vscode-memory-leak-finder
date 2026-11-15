# Python terminal process lifecycle

Exercises terminal shutdown after running finite and long-running Python
scripts, including checks for shell or Python processes left running after
the terminal closes.

Each iteration creates and kills two real integrated terminals:

- Run a finite Python script, verify Python exits while the interactive shell
  remains alive, then kill the terminal and verify the shell exits.
- Run a Python script that holds 16 MiB while sleeping, kill the active terminal,
  then verify both the Python and shell processes exit.

The fixture uses the normal terminal kill command, waits for the terminal to
leave the extension API's terminal list, and polls the actual process IDs.
Completion requires all process assertions to pass. On failure, the fixture
rescues only its own processes after the assertions. A JSONL journal in the
extension log directory records each successful case and its process IDs.
Temporary files, timers, and terminal instances are released per iteration.

Requires `--enable-extensions --run-skipped-tests-anyway`, Python on PATH
(`python3` on Linux, `python` on Windows), and Bash on Linux or Windows
PowerShell on Windows. The Python executable is resolved during setup.
No marketplace Python extension or interpreter discovery is involved.
The Linux run tests Bash process cleanup; it cannot establish whether the
reported Windows PowerShell or Python-extension behavior reproduces.

Use `--only terminal-python-process-lifecycle --runs 37 --measure-after` with
`--measure named-function-count3 --check-leaks` to check retained renderer
functions. Repeat with `--inspect-ptyhost` to inspect the terminal host.
On Linux, `--measure linux-process-memory` records PSS for the application tree;
resident-memory growth alone is not proof of a leak.
