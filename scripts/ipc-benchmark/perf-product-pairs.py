import argparse
from pathlib import Path
import csv
import hashlib
import json
import math
import os
import random
import statistics
import subprocess
from benchmark_process import run_owned

parser = argparse.ArgumentParser()
parser.add_argument('--products', required=True, help='JSON mapping variant to exact packaged executable and commit')
parser.add_argument('--output', required=True)
parser.add_argument('--variants', default='control,candidate')
parser.add_argument('--fixtures', default='context-unchanged,context-changing,clipboard-64KiB')
parser.add_argument('--replicates', type=int, default=10)
parser.add_argument('--iterations', type=int, default=32768)
parser.add_argument('--warmup', type=int, default=16384)
parser.add_argument('--concurrency', type=int, default=32)
parser.add_argument('--settle-ms', type=int, default=5000)
parser.add_argument('--cpu-profile', action='store_true', help='Diagnostic extension-host profile; do not treat profiled counters as normal instruction cost')
args = parser.parse_args()
if min(args.replicates, args.iterations, args.warmup, args.concurrency) <= 0:
    parser.error('Counts must be positive')
if args.iterations % args.concurrency or args.warmup % args.concurrency:
    parser.error('Iterations and warmup must be multiples of concurrency')
products = json.loads(Path(args.products).read_text())
output = Path(args.output).resolve()
output.mkdir(parents=True, exist_ok=False)
harness = Path(__file__).resolve().parent
fixture_extension = harness / 'product-extension'
variants = args.variants.split(',')
fixtures = args.fixtures.split(',')
assert 'control' in variants and len(set(variants)) == len(variants)
# Cyclic orders and their reversals balance every variant's run position.
orders = [variants[i:] + variants[:i] for i in range(len(variants))]
if len(variants) > 2:
    orders += [list(reversed(order)) for order in orders]
random.Random(3212535).shuffle(orders)
base = os.environ.copy()
base.pop('ELECTRON_RUN_AS_NODE', None)
base.pop('VSCODE_DEV', None)
base['LC_ALL'] = 'C'
manifest = {'perfVersion': subprocess.check_output(['perf', '--version'], text=True).strip(), 'arguments': vars(args), 'diagnosticOnly': args.cpu_profile, 'counterScope': 'Whole packaged application and inherited processes during completed extension API calls; includes real handler and background work; only extension-host GC is forced; Xvfb/startup/warmup excluded', 'samples': []}
for replicate in range(args.replicates):
    fixture_order = fixtures.copy()
    random.Random(3212535 + replicate).shuffle(fixture_order)
    for fixture in fixture_order:
        for variant in orders[replicate % len(orders)]:
            label = f'{replicate:03}-{fixture}-{variant}'
            target = output / label
            target.mkdir()
            for name in ['control.fifo', 'ack.fifo']:
                os.mkfifo(target / name, 0o600)
            descriptors = [os.open(target / name, os.O_RDWR | os.O_NONBLOCK) for name in ['control.fifo', 'ack.fifo']]
            product = products[variant]
            executable = Path(product['executable']).resolve()
            with executable.open('rb') as stream:
                if stream.read(4) != b'\x7fELF':
                    raise ValueError('Use the packaged application executable, not the bin/ CLI wrapper')
            options = {'fixture': fixture, 'iterations': args.iterations, 'warmup': args.warmup, 'concurrency': args.concurrency, 'settleMs': args.settle_ms, 'cpuProfile': args.cpu_profile, 'outputDirectory': str(target)}
            env = {**base, 'IPC_PRODUCT_BENCH_OPTIONS': json.dumps(options), 'PERF_CONTROL': str(target / 'control.fifo'), 'PERF_ACK': str(target / 'ack.fifo')}
            command = ['xvfb-run', '-a', 'perf', 'stat', '--delay=-1', '--control=fifo:' + str(target / 'control.fifo') + ',' + str(target / 'ack.fifo'), '-e', 'instructions:u,instructions:k', '-x', ';', '-o', str(target / 'counts.csv'), '--', str(executable), '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-extensions', '--disable-updates', '--disable-telemetry', '--disable-background-networking', '--disable-component-update', '--locale=en', '--ozone-platform=x11', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', '--force-disable-user-env', '--password-store=basic', '--new-window', '--user-data-dir=' + str(target / 'profile'), '--extensions-dir=' + str(target / 'extensions'), '--shared-data-dir=' + str(target / 'shared'), '--extensionDevelopmentPath=' + str(fixture_extension)]
            print('Start', label, flush=True)
            try:
                with (target / 'process.log').open('w') as log:
                    result = run_owned(command, env=env, cwd=target, stdout=log, stderr=log, timeout=300)
            finally:
                for descriptor in descriptors:
                    os.close(descriptor)
            if result.returncode:
                raise RuntimeError(f'{label} failed ({result.returncode}): ' + (target / 'process.log').read_text()[-1800:])
            if (target / 'error.json').exists():
                raise RuntimeError((target / 'error.json').read_text())
            counters = {}
            for row in csv.reader((target / 'counts.csv').read_text().splitlines(), delimiter=';'):
                if len(row) < 3 or row[2] not in ['instructions:u', 'instructions:k']:
                    continue
                if not row[0].strip().replace('.', '', 1).isdigit():
                    raise RuntimeError(f'Unavailable counter in {label}: {row}')
                if len(row) > 4 and row[4].strip() and float(row[4]) < 99:
                    raise RuntimeError(f'Multiplexed counter in {label}: {row}')
                counters[row[2]] = {'count': float(row[0]), 'raw': row, 'perLogicalCall': float(row[0]) / args.iterations}
            if len(counters) != 2:
                raise RuntimeError(f'Missing counters in {label}: {counters}')
            if (target / 'error.json').exists():
                raise RuntimeError((target / 'error.json').read_text())
            data = json.loads((target / 'result.json').read_text())
            assert data['measuredLogicalCalls'] == args.iterations
            assert data['bufferPool'] == 8192
            data.update({'replicate': replicate, 'variant': variant, 'product': product, 'counters': counters, 'executableSHA256': hashlib.sha256(executable.read_bytes()).hexdigest(), 'fixtureSHA256': hashlib.sha256((fixture_extension / 'extension.cjs').read_bytes()).hexdigest()})
            (target / 'result.json').write_text(json.dumps(data, indent=2))
            manifest['samples'].append({'label': label, 'status': 'success', 'path': label + '/result.json'})
            (output / 'manifest.json').write_text(json.dumps(manifest, indent=2))
            for name in ['control.fifo', 'ack.fifo']:
                (target / name).unlink()
            print(label, {key: round(value['perLogicalCall'], 2) for key, value in counters.items()}, flush=True)

summary = {'diagnosticOnly': args.cpu_profile, 'arguments': vars(args), 'pairedIndependentProcesses': args.replicates, 'confidence': 'Exploratory 95% paired bootstrap of median log-ratios; 10,000 resamples; no multiple-comparison correction', 'fixtures': {}}
for fixture in fixtures:
    row = {}
    values = {v: [json.loads((output / f'{i:03}-{fixture}-{v}' / 'result.json').read_text()) for i in range(args.replicates)] for v in variants}
    for counter in ['instructions:u', 'instructions:k']:
        numbers = {v: [data['counters'][counter]['perLogicalCall'] for data in rows] for v, rows in values.items()}
        entry = {'medianInstructionsPerCall': {v: statistics.median(xs) for v, xs in numbers.items()}, 'comparisons': {}}
        for variant in variants:
            if variant == 'control':
                continue
            ratios = [math.log(a / b) for a, b in zip(numbers[variant], numbers['control'])]
            rng = random.Random(3212536)
            boot = sorted(statistics.median(rng.choices(ratios, k=len(ratios))) for _ in range(10000))
            interval = [(math.exp(boot[i]) - 1) * 100 for i in [249, 9749]]
            entry['comparisons'][variant] = {'medianPairedChangePercent': (math.exp(statistics.median(ratios)) - 1) * 100, 'intervalPercent': interval, 'inconclusive': args.replicates < 5 or interval[0] <= 0 <= interval[1]}
        row[counter] = entry
    summary['fixtures'][fixture] = row
(output / 'summary.json').write_text(json.dumps(summary, indent=2))
print(json.dumps(summary, indent=2), flush=True)
