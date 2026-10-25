"""Compile archived protocol experiments with identical options, outside tracked VS Code sources."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True, help='VS Code checkout with existing dependencies and client output')
parser.add_argument('--sources', required=True, help='Directory of frozen experiment .ts files from the evidence archive')
parser.add_argument('--manifest', required=True)
parser.add_argument('--compiler', help='Optional esbuild executable, useful for a frozen output-only runtime')
args = parser.parse_args()
root = Path(args.root).resolve()
sources = Path(args.sources).resolve()
esbuild = Path(args.compiler).resolve() if args.compiler else root / 'build/node_modules/.bin/esbuild'
version = subprocess.check_output([str(esbuild), '--version'], text=True).strip()
entries = []
for source in sorted(sources.glob('*.ts')):
    match = re.fullmatch(r'(rpcProtocol|rpcMessagePort|ipc)\.([a-z0-9-]+)\.ts', source.name)
    if not match:
        continue
    folder = 'vs/base/parts/ipc/common' if match[1] == 'ipc' else 'vs/workbench/services/extensions/common'
    output = root / 'out' / folder / source.with_suffix('.js').name
    command = [str(esbuild), str(source), '--format=esm', '--target=es2024', '--tsconfig-raw={"compilerOptions":{"experimentalDecorators":true,"useDefineForClassFields":false}}', '--outfile=' + str(output)]
    subprocess.run(command, cwd=root, check=True)
    entries.append({'source': source.name, 'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(), 'compiledModule': str(output.relative_to(root / 'out')), 'compiledSHA256': hashlib.sha256(output.read_bytes()).hexdigest()})
if not entries:
    raise RuntimeError('No experiment sources found; canonical production files are never overwritten')
Path(args.manifest).write_text(json.dumps({'esbuild': version, 'target': 'es2024', 'format': 'esm', 'experimentalDecorators': True, 'useDefineForClassFields': False, 'modules': entries}, indent=2))
