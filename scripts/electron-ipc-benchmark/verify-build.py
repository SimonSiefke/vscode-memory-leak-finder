import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


def verify(root, expected_sha=None):
    root = Path(root).resolve()
    if expected_sha:
        actual = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
        if actual != expected_sha:
            raise RuntimeError(f"Unexpected revision: {actual}")
    missing = []
    checked = 0
    for package in (root / "extensions").glob("*/package.json"):
        main = json.loads(package.read_text()).get("main")
        if not isinstance(main, str):
            continue
        checked += 1
        filename = package.parent / main
        if not any(p.is_file() for p in [filename, Path(f"{filename}.js"), Path(f"{filename}.cjs"), filename / "index.js"]):
            missing.append(str(filename.relative_to(root)))
    if missing or checked == 0:
        raise RuntimeError(f"Missing built-in extension output: {missing}; checked={checked}")
    for filename in ["out/main.js", "out/vs/base/browser/ui/codicons/codicon/codicon.ttf", "test/smoke/out/main.js"]:
        if not (root / filename).is_file() or not (root / filename).stat().st_size:
            raise RuntimeError(f"Missing build output: {filename}")
    executable = root / ".build/electron/code-oss"
    env = dict(os.environ, ELECTRON_RUN_AS_NODE="1")
    # Execute a query in Electron, so a stale/wrong-ABI native binary cannot pass.
    script = """const sqlite = require('@vscode/sqlite3');
const db = new sqlite.Database(':memory:');
db.get('SELECT 42 AS answer', (error, row) => {
 if (error || row.answer !== 42) { console.error(error); process.exit(1); }
 db.close(error => { if (error) process.exit(1); console.log('SQLite verified'); });
});"""
    subprocess.run([str(executable), "-e", script], cwd=root, env=env, check=True, timeout=30)
    native = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / "node_modules").rglob("*.node")}
    metadata = {"sha": expected_sha, "node": (root / ".nvmrc").read_text().strip(), "electron": (root / ".build/electron/version").read_text().strip(), "builtinExtensions": checked, "nativeModules": native}
    if expected_sha:
        (root / "ipc-build.json").write_text(json.dumps(metadata, indent=2))
    return metadata


if __name__ == "__main__":
    print(json.dumps(verify(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None), indent=2))
