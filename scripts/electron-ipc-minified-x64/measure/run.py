import importlib.util
import itertools
import json
import os
from pathlib import Path
import random
import re
import shutil
import signal
import subprocess
import sys
import time

DRIVER = Path(__file__).resolve().parents[3]
ROOT = Path(os.environ['IPC_BENCHMARK_ROOT']).resolve()
PRODUCTS = Path(os.environ['IPC_PRODUCT_ROOT']).resolve()
VARIANTS = ['buffer', 'before', 'after']
COMMITS = dict(zip(VARIANTS, ['959031245ebb1fe077e0d512e1397c0ae82006e4', 'd6352725adca1ebaebbabb24f65b63c88167fda3', 'fb616229bd8383a07d0cdee17e5c844c9aa0a50c']))
ARCH = os.environ['IPC_ARCH']
REPLICA = int(os.environ['IPC_REPLICA'])
FIXTURE_SHA = 'ecb012634f104f7a8188d9e3610a4d2d65bef6f6'
SELECTION = 'Data Loss|Preferences|Settings editor|Search|Quick Open|Language Features|Task|Statusbar|Extension Host Restart|Multiroot|Launch|Accessibility'
ROOT.mkdir(parents=True, exist_ok=True)


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2))


def execute(command, cwd, output, timeout=900, env=None):
    output.parent.mkdir(parents=True, exist_ok=True)
    start = time.monotonic()
    with output.open('w') as stream:
        process = subprocess.Popen(command, cwd=cwd, env=env, stdout=stream, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            code = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
            raise RuntimeError(f'Timed out: {command}; {output}')
    text = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', output.read_text(errors='replace'))
    if code:
        print(text[-12000:], flush=True)
        raise RuntimeError(f'Exit {code}: {command}; {output}')
    return time.monotonic() - start, text


def logs(directory, output):
    files = list(directory.rglob('*.log'))
    if not files:
        raise RuntimeError(f'Missing product logs: {directory}')
    errors = [line for f in files for line in f.read_text(errors='replace').splitlines() if re.search(r'Cannot find module|Cannot find package|NODE_MODULE_VERSION|Activating extension .*failed', line)]
    if errors:
        save(output / 'setup-errors.json', errors)
        raise RuntimeError('Native module or extension activation failure')
    shutil.copytree(directory, output / 'product-logs', dirs_exist_ok=True)


def verifier():
    spec = importlib.util.spec_from_file_location('verify_package', Path(__file__).parents[1] / 'build/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify():
    builds = {v: verifier().verify(PRODUCTS / v / 'package', COMMITS[v], ARCH) for v in VARIANTS}
    for v in VARIANTS:
        for key in ['runtime', 'builtinExtensions']:
            if builds[v][key] != builds['buffer'][key]:
                raise RuntimeError(f'Unmatched {key}')
        if set(builds[v]['nativeModules']) != set(builds['buffer']['nativeModules']):
            raise RuntimeError('Unmatched native-module inventories')
    if ARCH == 'x64':
        recorded = {v: json.loads((PRODUCTS / v / 'package/ipc-minified-build.json').read_text()) for v in VARIANTS}
        for v in VARIANTS:
            sources = recorded[v]['smokeHarnessSources']
            if sources != recorded['buffer']['smokeHarnessSources']:
                raise RuntimeError('Unmatched smoke harness source revisions')
            for relative, expected in sources.items():
                if verifier().digest(PRODUCTS / v / 'product' / relative) != expected:
                    raise RuntimeError(f'Smoke harness source changed: {v} {relative}')
    save(ROOT / 'verified-builds.json', builds)
    environment = {'replica': REPLICA, 'architecture': ARCH, 'buildType': 'bundled minified package', 'packagingRepair': 'Extension-only Copilot SDK retention; same repair on all variants', 'variants': COMMITS, 'startupSamples': int(os.environ.get('IPC_STARTUP_SAMPLES', '0')) if ARCH == 'x64' else 0, 'cpuSamples': 15 if ARCH == 'arm64' else 0, 'smokeSamples': 7 if ARCH == 'x64' else 0, 'workflowRun': os.environ.get('GITHUB_RUN_ID'), 'buildRun': os.environ['IPC_BUILD_RUN'], 'driverSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=DRIVER, text=True).strip(), 'driverCoreSha': '53337ee3aaab1a180ae116fb32777587e4b1c679', 'runnerImage': os.environ.get('ImageVersion'), 'cpu': subprocess.check_output(['lscpu'], text=True), 'kernel': subprocess.check_output(['uname', '-a'], text=True), 'fixtureSha': FIXTURE_SHA, 'smokeSelection': SELECTION}
    save(ROOT / 'environment.json', environment)
    if ARCH == 'arm64':
        _, report = execute(['perf', 'stat', '-x,', '-e', 'instructions:u,cycles:u', '--', 'python3', '-c', 'print(sum(range(10000000)))'], DRIVER, ROOT / 'perf-probe.txt', 60)
        counters = {}
        for line in report.splitlines():
            fields = line.split(',')
            if len(fields) > 2 and fields[2] in ['instructions:u', 'cycles:u']:
                counters[fields[2]] = float(fields[0])
        if not all(counters.get(k, 0) > 0 for k in ['instructions:u', 'cycles:u']):
            raise RuntimeError('Hardware counters unavailable; cannot measure CPU')
        save(ROOT / 'perf-capability.json', {'available': True, 'counters': counters})
    else:
        save(ROOT / 'perf-capability.json', {'available': False, 'reason': 'x64 timing experiment; native ARM64 hardware counters are reported separately'})


def cpu(pilot=False):
    for block in range(1 if pilot else 5):
        order = VARIANTS.copy()
        random.Random(330439 + REPLICA * 100 + block).shuffle(order)
        for variant in order:
            output = ROOT / 'evidence' / f'{"pilot" if pilot else "cpu"}-{block:02d}-{variant}'
            output.mkdir(parents=True, exist_ok=True)
            cache = DRIVER / '.vscode-user-data-dir/CachedProfilesData/__default__profile__/extensions.builtin.cache'
            if cache.exists():
                cache.rename(output / 'extensions.builtin.cache')
            logdir = DRIVER / '.vscode-user-data-dir/logs'
            if logdir.exists():
                shutil.rmtree(logdir)
            result = DRIVER / '.vscode-memory-leak-finder-results/cpu-performance-counters-from-start/editor-open-text-file.json'
            result.unlink(missing_ok=True)
            command = ['xvfb-run', '-a', shutil.which('node'), 'packages/cli/bin/test.js', '--run-skipped-tests-anyway', '--run-network-tests-anyway', '--only', 'editor-open-text-file', '--runs', '1', '--startup-runs', '1' if pilot else '3', '--workers', '1', '--vscode-path', str(PRODUCTS / variant / 'package/code-oss')]
            if not pilot:
                command += ['--measure', 'cpu-performance-counters-from-start']
            save(output / 'provenance.json', {'command': command, 'sha': COMMITS[variant], 'startedAt': time.time()})
            print(f'START {"pilot" if pilot else "cpu"} {block} {variant}', flush=True)
            start = time.time()
            duration, report = execute(command, DRIVER, output / 'run.log')
            if re.search(r'\bFAIL\b|SKIP \(FAIL\)', report) or not re.search(r'editor-open-text-file.*(?:PASS|SKIP \(PASS\))|(?:PASS|SKIP \(PASS\)).*editor-open-text-file', report):
                print(report[-12000:]); raise RuntimeError('Scenario did not pass')
            row = {'block': block, 'variant': variant, 'sha': COMMITS[variant], 'duration': duration}
            if not pilot:
                if not result.exists() or result.stat().st_mtime < start:
                    raise RuntimeError('Missing fresh CPU results')
                raw = json.loads(result.read_text())
                samples = raw['cpuPerformanceCountersFromStart']['samples']
                if len(samples) != 3 or any(s['instructions'] <= 0 or s['cycles'] <= 0 for s in samples):
                    raise RuntimeError('Invalid CPU counters')
                shutil.copy2(result, output / 'measure.json')
                row['samples'] = [{'instructions': s['instructions'], 'cycles': s['cycles']} for s in samples]
            logs(logdir, output)
            save(output / 'accepted.json', row)
            print(f'ACCEPT {"pilot" if pilot else "cpu"} {block} {variant}', flush=True)


def startup():
    workspace = ROOT / 'startup-workspace'
    workspace.mkdir(exist_ok=True)
    (workspace / 'test.txt').write_text(''.join(f'Line {n}: hello world\n' for n in range(100)))
    builds = {}
    try:
        for v in VARIANTS:
            package = PRODUCTS / v / 'package'
            out = package / 'resources/app/out'
            backup = package / 'pristine-out'
            out.rename(backup)
            builds[v] = (out, backup)
            shutil.copytree(package / 'startup-out', out)
        permutations = list(itertools.permutations(VARIANTS))
        for index in range(-3, int(os.environ['IPC_STARTUP_SAMPLES'])):
            order = permutations[(index + 3 + REPLICA) % len(permutations)]
            for variant in order:
                output = ROOT / 'startup' / f'{variant}-{index + 3:04d}.json'
                profile = ROOT / 'startup-profiles' / variant
                profile.mkdir(parents=True, exist_ok=True)
                extensions = ROOT / 'startup-extensions'
                extensions.mkdir(exist_ok=True)
                logdir = profile / 'logs'
                if logdir.exists():
                    shutil.rmtree(logdir)
                command = [str(PRODUCTS / variant / 'package/code-oss'), '--new-window', '--disable-extensions', '--disable-updates', '--disable-telemetry', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--skip-add-to-recently-opened', '--force-disable-user-env', '--no-sandbox', '--memory-leak-finder-benchmark-startup', '--user-data-dir', str(profile), '--extensions-dir', str(extensions), str(workspace)]
                env = dict(os.environ)
                for key in ['VSCODE_DEV', 'VSCODE_SKIP_PRELAUNCH', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS']:
                    env.pop(key, None)
                duration, report = execute(command, DRIVER, output.with_suffix('.log'), timeout=120, env=env)
                records = [json.loads(line.split('\t', 1)[1]) for line in report.splitlines() if line.startswith('VSCODE_STARTUP_BENCHMARK\t')]
                if len(records) != 1:
                    raise RuntimeError(f'Missing startup record: {variant} {index}')
                record = records[0]
                if record.get('commit') != COMMITS[variant] or record.get('milestone') != 'timerService.whenReady':
                    raise RuntimeError('Invalid startup recorder provenance')
                main, elapsed = record['mainToTimerReady'], record['startupMetrics']['ellapsed']
                if not (0 < main < 120000 and 0 < elapsed < 120000):
                    raise RuntimeError('Invalid startup timings')
                # Keep detailed product logs for warmups; validate every measured launch.
                logs(logdir, ROOT / 'startup-log-audit' / f'{variant}-{index + 3:04d}')
                save(output, {'variant': variant, 'sha': COMMITS[variant], 'index': index, 'warmup': index < 0, 'mainToTimerReady': main, 'elapsed': elapsed, 'processDuration': duration, 'recorder': record, 'command': command})
                time.sleep(1)
            if index < 0 or index % 25 == 0:
                print(f'ACCEPT startup round {index}', flush=True)
    finally:
        for out, backup in builds.values():
            if out.exists():
                shutil.rmtree(out)
            backup.rename(out)
    for v in VARIANTS:
        verifier().verify(PRODUCTS / v / 'package', COMMITS[v], ARCH)
    save(ROOT / 'startup-restored.json', {'variants': COMMITS, 'verified': True})


def smoke():
    verify()
    fixture = DRIVER / 'smoke-fixture'
    if subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=fixture, text=True).strip() != FIXTURE_SHA:
        raise RuntimeError('Smoke fixture revision mismatch')
    inventory = None
    for block in range(-1, 7):
        order = VARIANTS.copy()
        random.Random(330439 + REPLICA * 100 + block).shuffle(order)
        for variant in order:
            source = PRODUCTS / variant / 'product'
            output = ROOT / 'evidence' / f'smoke-{block:02d}-{variant}'
            output.mkdir(parents=True, exist_ok=True)
            command = ['xvfb-run', '-a', os.environ['IPC_PRODUCT_NODE'], 'test/index.js', '--build', str(PRODUCTS / variant / 'package'), '--skip-stable-build', '--test-repo', str(fixture), '--electronArgs=--no-sandbox', '--fail-zero', '-g', SELECTION]
            env = dict(os.environ)
            env['PATH'] = str(Path(os.environ['IPC_PRODUCT_NODE']).parent) + ':' + env['PATH']
            save(output / 'provenance.json', {'command': command, 'sha': COMMITS[variant], 'fixtureSha': FIXTURE_SHA, 'startedAt': time.time()})
            print(f'START smoke {block} {variant}', flush=True)
            duration, report = execute(command, source / 'test/smoke', output / 'run.log', env=env)
            passed = re.search(r'(\d+) passing', report)
            pending = re.search(r'(\d+) pending', report)
            current = [int(passed[1]) if passed else 0, int(pending[1]) if pending else 0]
            tests = sorted(re.sub(r'\s+\(\d+ms\)$', '', line.strip()) for line in report.splitlines() if re.match(r'\s*[✓✔]', line))
            current_inventory = {'counts': current, 'tests': tests}
            if not current[0] or len(tests) != current[0] or re.search(r'\d+ failing', report):
                print(report[-12000:]); raise RuntimeError('Smoke suite did not pass')
            if inventory is None:
                inventory = current_inventory
                save(ROOT / 'smoke-inventory.json', inventory)
            elif inventory != current_inventory:
                save(output / 'changed-inventory.json', current_inventory)
                raise RuntimeError('Smoke inventory changed between variants or repetitions')
            logs(source / '.build/logs/smoke-tests-electron', output)
            save(output / 'accepted.json', {'block': block, 'warmup': block < 0, 'variant': variant, 'sha': COMMITS[variant], 'duration': duration, 'passing': current[0], 'pending': current[1], 'fixtureSha': FIXTURE_SHA})
            print(f'ACCEPT smoke {block} {variant}: {duration:.3f}s, {current}', flush=True)


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'verify':
        verify()
    elif mode == 'startup':
        startup()
    elif mode == 'smoke':
        smoke()
    else:
        cpu(pilot=mode == 'pilot')
