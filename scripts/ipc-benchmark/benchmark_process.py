"""Run each measurement in an owned process group, including timeout cleanup."""
import os
import signal
import subprocess


def run_owned(command, **kwargs):
    """Clean up only this measurement's descendants on success, timeout or interruption."""
    timeout = kwargs.pop('timeout', None)
    process = subprocess.Popen(command, start_new_session=True, **kwargs)
    try:
        returncode = process.wait(timeout=timeout)
        return subprocess.CompletedProcess(command, returncode)
    finally:
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            pass
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        process.wait()
