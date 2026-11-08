import importlib.metadata
import json
import pathlib
import subprocess
import sys

subprocess.check_call([
    sys.executable, "-m", "pip", "install", "--disable-pip-version-check",
    "--no-input", "--no-index", "--find-links", ".wheels", "--force-reinstall",
    "-r", "requirements.txt",
])

from app import app

version = importlib.metadata.version("Flask")
assert version == "3.1.2"
with app.test_client() as client:
    response = client.get("/total?name=e2e")
    assert response.status_code == 200
    assert response.json == {"name": "e2e", "total": 42}
result = {"version": version, "response": response.json}
pathlib.Path(".pip-result.json").write_text(json.dumps(result), encoding="utf-8")
print("Flask installation verified: 42", flush=True)
