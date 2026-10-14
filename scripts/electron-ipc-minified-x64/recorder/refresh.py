import hashlib
import importlib.util
import json
from pathlib import Path

root = Path('package')
metadata_path = root / 'ipc-minified-build.json'
recorded = json.loads(metadata_path.read_text())
# Only the recorder and its matching manifest are refreshed. Every pristine
# core output, native module and product manifest must retain its original hash.
recorded['startupOut'] = {str(p.relative_to(root / 'startup-out')): hashlib.sha256(p.read_bytes()).hexdigest() for p in (root / 'startup-out').rglob('*') if p.is_file()}
recorded['startupProductJson'] = hashlib.sha256((root / 'startup-product.json').read_bytes()).hexdigest()
recorded['startupRecorderPatch'] = hashlib.sha256(Path('scripts/electron-ipc-minified-x64/recorder/startup.patch').read_bytes()).hexdigest()
metadata_path.write_text(json.dumps(recorded, indent=2))
spec = importlib.util.spec_from_file_location('verify_package', 'scripts/electron-ipc-minified-x64/build/verify.py')
module = importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
module.verify(root, recorded['sha'], 'x64')
