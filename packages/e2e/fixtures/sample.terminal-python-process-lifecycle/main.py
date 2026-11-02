import json
import os
import pathlib
import sys
import time

# Keep a real allocation alive until normal exit or terminal shutdown.
payload = bytearray(16 * 1024 * 1024)
pathlib.Path(sys.argv[1]).write_text(json.dumps({"pid": os.getpid()}))
if sys.argv[2] == "running":
    time.sleep(120)
print("python-terminal-lifecycle-complete", flush=True)
