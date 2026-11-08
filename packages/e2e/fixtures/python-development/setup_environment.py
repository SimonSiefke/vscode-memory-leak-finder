import pathlib
import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "venv", ".venv"])
python = pathlib.Path(".venv") / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
subprocess.check_call([str(python), "-m", "pip", "--version"])
if "--flask" in sys.argv:
    subprocess.check_call([
        str(python), "-m", "pip", "download", "--disable-pip-version-check",
        "--no-input", "--no-cache-dir", "--dest", ".wheels", "-r", "requirements.txt",
    ])
    subprocess.check_call([
        str(python), "-m", "pip", "install", "--disable-pip-version-check",
        "--no-input", "--no-index", "--find-links", ".wheels", "-r", "requirements.txt",
    ])
print("Python development environment ready", flush=True)
