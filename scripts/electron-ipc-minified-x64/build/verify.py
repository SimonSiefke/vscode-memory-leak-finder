import hashlib
import json
import os
import re
from pathlib import Path
import struct
import subprocess
import sys


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify(root, sha, arch, source=None):
    root = Path(root).resolve()
    app = root / "resources/app"
    executable = root / "code-oss"
    expected_machine = {"x64": 62, "arm64": 183}[arch]
    with executable.open("rb") as stream:
        header = stream.read(20)
    if header[:4] != b"\x7fELF" or header[4] != 2 or struct.unpack("<H", header[18:20])[0] != expected_machine:
        raise RuntimeError("Packaged Electron has the wrong architecture")
    product = json.loads((app / "product.json").read_text())
    if product.get("commit") != sha:
        raise RuntimeError(f"Packaged commit mismatch: {product.get('commit')}")
    for name in ["out/main.js", "out/vs/workbench/workbench.desktop.main.js", "out/media/codicon.ttf", "node_modules.asar"]:
        if not (app / name).is_file() or not (app / name).stat().st_size:
            raise RuntimeError(f"Missing packaged output: {name}")
    css_path = app / "out/vs/workbench/workbench.desktop.main.css"
    font_urls = [u.strip("\"' ") for u in re.findall(r"url\(([^)]+)\)", css_path.read_text()) if "codicon.ttf" in u]
    if not font_urls or any((css_path.parent / u).resolve() != (app / "out/media/codicon.ttf").resolve() for u in font_urls):
        raise RuntimeError("Packaged CSS does not resolve the codicon font")
    if (app / "out/media/codicon.ttf").read_bytes()[:4] not in [b"\x00\x01\x00\x00", b"OTTO"]:
        raise RuntimeError("Invalid packaged font data")
    if (app / "out/vs/base/common/uri.js").exists():
        raise RuntimeError("An unbundled development output was supplied")
    extensions = {}
    for manifest in (app / "extensions").glob("*/package.json"):
        definition = json.loads(manifest.read_text())
        main = definition.get("main")
        if not isinstance(main, str):
            continue
        entry = manifest.parent / main
        if not any(p.is_file() for p in [entry, Path(f"{entry}.js"), Path(f"{entry}.cjs"), entry / "index.js"]):
            raise RuntimeError(f"Missing packaged built-in entrypoint: {entry}")
        extensions[manifest.parent.name] = main
    if not extensions:
        raise RuntimeError("No desktop built-ins were packaged")
    script = """const sqlite = require('./node_modules.asar/@vscode/sqlite3');
const db = new sqlite.Database(':memory:');
db.get('SELECT 42 AS answer', (error, row) => {
 if (error || row.answer !== 42) { console.error(error); process.exit(1); }
 db.close(error => {
  if (error) { console.error(error); process.exit(1); }
  console.log(JSON.stringify({ sqlite: row.answer, arch: process.arch, electron: process.versions.electron, node: process.versions.node }));
 });
});"""
    result = subprocess.run([str(executable), "-e", script], cwd=app, env=dict(os.environ, ELECTRON_RUN_AS_NODE="1"), capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError(f"Packaged SQLite verification failed: {result.stdout}\n{result.stderr}")
    runtime = json.loads(result.stdout.splitlines()[-1])
    if runtime["sqlite"] != 42 or runtime["arch"] != arch:
        raise RuntimeError("Packaged native-module verification failed")
    out = app / "out"
    pristine = {str(p.relative_to(out)): digest(p) for p in out.rglob("*") if p.is_file()}
    startup = root / "startup-out"
    if arch == "x64":
        if not startup.is_dir():
            raise RuntimeError("Missing bundled startup recorder")
        strings = ["VSCODE_STARTUP_BENCHMARK", "vscode-startup-benchmark"]
        found = {s: False for s in strings}
        for p in startup.rglob("*.js"):
            text = p.read_text()
            for s in strings:
                found[s] = found[s] or s in text
        if not all(found.values()):
            raise RuntimeError("Startup recorder did not survive minification")
    metadata = {
        "sha": sha, "architecture": arch, "buildType": "bundled minified package",
        "buildTask": f"vscode-linux-{arch}-min", "runtime": runtime,
        "builtinExtensions": extensions,
        "nativeModules": {str(p.relative_to(app)): digest(p) for p in app.rglob("*.node")},
        "pristineOut": pristine,
        "startupOut": {str(p.relative_to(startup)): digest(p) for p in startup.rglob("*") if p.is_file()} if startup.exists() else {},
    }
    if source:
        source = Path(source).resolve()
        if subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=source, text=True).strip() != sha:
            raise RuntimeError("Source revision mismatch")
        metadata["sourceNode"] = (source / ".nvmrc").read_text().strip()
        if arch == "x64":
            for name in ["test/smoke/out/main.js", "test/automation/out/index.js"]:
                if not (source / name).is_file():
                    raise RuntimeError(f"Missing smoke harness: {name}")
            metadata["smokeHarnessSources"] = {str(p.relative_to(source)): digest(p) for folder in ["test/smoke", "test/automation"] for p in (source / folder).rglob("*.ts") if "node_modules" not in p.parts}
        (root / "ipc-minified-build.json").write_text(json.dumps(metadata, indent=2))
    else:
        recorded = json.loads((root / "ipc-minified-build.json").read_text())
        for key in ["sha", "architecture", "buildType", "runtime", "builtinExtensions", "nativeModules", "pristineOut", "startupOut"]:
            if metadata[key] != recorded[key]:
                raise RuntimeError(f"Packaged artifact changed: {key}")
    print(f"Verified minified Linux {arch}: {sha}; {len(extensions)} built-ins; SQLite query passed", flush=True)
    return metadata


if __name__ == "__main__":
    verify(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
