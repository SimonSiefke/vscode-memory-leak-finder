import argparse
import hashlib
import itertools
import json
import math
import os
from pathlib import Path
import random
import statistics
import subprocess
from benchmark_process import run_owned

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--experiment', choices=['aa', 'state', 'text', 'batch', 'refs'], required=True)
parser.add_argument('--kind', choices=['node', 'renderer'], required=True)
parser.add_argument('--concurrency', type=int, default=1)
parser.add_argument('--replicates', type=int, default=50)
args = parser.parse_args()
root = Path(args.root).resolve()
output = Path(args.output).resolve()
output.mkdir(parents=True, exist_ok=True)
harness = Path(__file__).resolve().parent
base = os.environ.copy()
base.pop('ELECTRON_RUN_AS_NODE', None)
base.pop('VSCODE_DEV', None)
variants = {'aa': ['control', 'aa-b', 'aa-c'], 'state': ['control', 'lean-state'], 'text': ['control', 'large-text'], 'batch': ['control', 'batch64', 'batch256'], 'refs': ['control', 'ref-enumeration']}[args.experiment]
filters = {'aa': '^(primitive|small-object|settings-100)$', 'state': '^(primitive|small-object|settings-100)$', 'text': '^(primitive|small-object|text-4KiB|text-64KiB|text-escaped)$', 'batch': '^(primitive|small-object|settings-100|text-4KiB)$', 'refs': '^(wrapped-settings-100|workspace-edits-100|notebook-100)$'}
orders = list(itertools.permutations(variants))
random.Random(3212530).shuffle(orders)
for replicate in range(args.replicates):
    # Independent processes; randomized construction/warmup order as well as timed order.
    order = list(orders[replicate % len(orders)])
    modules = {v: 'vs/workbench/services/extensions/common/rpcProtocol.' + ('control' if args.experiment == 'batch' else v) + '.js' for v in order}
    port_modules = {v: 'vs/workbench/services/extensions/common/rpcMessagePort.' + v + '.js' for v in order} if args.experiment == 'batch' else {}
    config = {'root': str(root), 'modules': modules, 'portModules': port_modules, 'blocks': 1, 'iterations': 1024, 'samples': 3, 'concurrency': args.concurrency, 'seed': 3212530 + replicate, 'fixtureFilter': filters[args.experiment]}
    target = output / f'{replicate:03}.json'
    if target.exists():
        raise RuntimeError(f'Result already exists: {target}; use a fresh output directory')
    env = {**base, 'IPC_OPT_BENCH_OPTIONS': json.dumps(config), 'OUTPUT': str(target)}
    command = ['node', '--import', str(harness / 'product-pool.mjs'), str(harness / 'node.mjs')] if args.kind == 'node' else ['xvfb-run', '-a', str(root / '.build/electron/code-oss'), '--no-sandbox', '--disable-gpu', '--user-data-dir=' + str(output / 'renderer-profile'), str(harness / 'paired-renderer-main.cjs')]
    with (output / f'{replicate:03}.log').open('w') as log:
        result = run_owned(command, cwd=root, env=env, stdout=log, stderr=log, timeout=300)
    if result.returncode:
        raise RuntimeError(f'Replicate {replicate} failed ({result.returncode}); diagnostics retained')
    data = json.loads(target.read_text())
    data['replicate'] = replicate
    data['constructionOrder'] = order
    data['compiledSHA256'] = {v: hashlib.sha256((root / 'out' / path).read_bytes()).hexdigest() for v, path in modules.items()}
    data['portSHA256'] = {v: hashlib.sha256((root / 'out' / path).read_bytes()).hexdigest() for v, path in port_modules.items()}
    target.write_text(json.dumps(data, indent=2))
    print(f'{args.experiment}/{args.kind}/{args.concurrency}: {replicate + 1}/{args.replicates}', flush=True)

summary = {'experiment': args.experiment, 'kind': args.kind, 'concurrency': args.concurrency, 'independentProcesses': args.replicates, 'inferenceUnit': 'median of three batches in each fresh process', 'confidence': 'exploratory 95% paired bootstrap of median log-ratios; 10,000 resamples; no multiple-comparison correction', 'fixtures': {}}
data = [json.loads((output / f'{i:03}.json').read_text()) for i in range(args.replicates)]
for name in sorted(f['name'] for f in data[0]['blocks'][0]['fixtures']):
    values = {v: [statistics.median(next(run['microsecondsPerRoundTrip'] for f in row['blocks'][0]['fixtures'] if f['name'] == name for run in f['runs'] if run['variant'] == v)) for row in data] for v in variants}
    fixture = {'medianUs': {v: statistics.median(vs) for v, vs in values.items()}, 'comparisons': {}}
    for v in variants:
        if v == 'control':
            continue
        ratios = [math.log(after / before) for before, after in zip(values['control'], values[v])]
        rng = random.Random(3212531)
        samples = sorted(statistics.median(rng.choices(ratios, k=len(ratios))) for _ in range(10000))
        interval = [(math.exp(samples[i]) - 1) * 100 for i in [249, 9749]]
        fixture['comparisons'][v] = {'medianPairedChangePercent': (math.exp(statistics.median(ratios)) - 1) * 100, 'intervalPercent': interval, 'inconclusive': args.replicates < 5 or interval[0] <= 0 <= interval[1]}
    summary['fixtures'][name] = fixture
(output / 'summary.json').write_text(json.dumps(summary, indent=2))
print(json.dumps(summary, indent=2), flush=True)
