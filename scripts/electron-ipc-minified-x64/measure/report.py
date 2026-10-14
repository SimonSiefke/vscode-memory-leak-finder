import argparse
import csv
import importlib.util
import json
from pathlib import Path
import statistics

VARIANTS = ['buffer', 'before', 'after']
COMMITS = dict(zip(VARIANTS, ['959031245ebb1fe077e0d512e1397c0ae82006e4', 'd6352725adca1ebaebbabb24f65b63c88167fda3', 'fb616229bd8383a07d0cdee17e5c844c9aa0a50c']))
spec = importlib.util.spec_from_file_location('statistics_helper', Path(__file__).parents[2] / 'electron-ipc-benchmark/summarize.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def load(root, arch):
    env = json.loads((root / 'environment.json').read_text())
    if env['architecture'] != arch or env['buildType'] != 'bundled minified package' or env['variants'] != COMMITS:
        raise RuntimeError('Unexpected architecture, build type or revisions')
    builds = json.loads((root / 'verified-builds.json').read_text())
    if any(builds[v]['sha'] != COMMITS[v] or builds[v]['architecture'] != arch for v in VARIANTS):
        raise RuntimeError('Invalid verified build provenance')
    metrics = ['instructions', 'cycles'] if arch == 'arm64' else ['mainToTimerReady', 'elapsed', 'smokeSeconds']
    values = {m: {v: [] for v in VARIANTS} for m in metrics}
    blocks = {m: {v: {} for v in VARIANTS} for m in metrics}
    for v in VARIANTS:
        if arch == 'arm64':
            if not (root / f'evidence/pilot-00-{v}/accepted.json').exists():
                raise RuntimeError('Missing editor pilot')
            for p in sorted(root.glob(f'evidence/cpu-*-{v}/accepted.json')):
                row = json.loads(p.read_text())
                if row['sha'] != COMMITS[v] or len(row['samples']) != 3:
                    raise RuntimeError('Invalid CPU result')
                for m in metrics:
                    sample = [s[m] for s in row['samples']]
                    values[m][v].extend(sample)
                    blocks[m][v][row['block']] = statistics.mean(sample)
        else:
            if not json.loads((root / 'startup-restored.json').read_text())['verified']:
                raise RuntimeError('Startup instrumentation not restored')
            for p in sorted(root.glob(f'startup/{v}-[0-9]*.json')):
                row = json.loads(p.read_text())
                if row['sha'] != COMMITS[v]:
                    raise RuntimeError('Invalid startup revision')
                if row['warmup']:
                    continue
                for m in ['mainToTimerReady', 'elapsed']:
                    values[m][v].append(row[m]); blocks[m][v][row['index']] = row[m]
            inventory = json.loads((root / 'smoke-inventory.json').read_text())['counts']
            for p in sorted(root.glob(f'evidence/smoke-*-{v}/accepted.json')):
                row = json.loads(p.read_text())
                if row['sha'] != COMMITS[v] or [row['passing'], row['pending']] != inventory:
                    raise RuntimeError('Invalid smoke result')
                if row['warmup']:
                    continue
                values['smokeSeconds'][v].append(row['duration']); blocks['smokeSeconds'][v][row['block']] = row['duration']
    expected = {'instructions': 15, 'cycles': 15} if arch == 'arm64' else {'mainToTimerReady': env['startupSamples'], 'elapsed': env['startupSamples'], 'smokeSeconds': 7}
    complete = all(len(values[m][v]) == expected[m] and len(blocks[m][v]) == (5 if arch == 'arm64' else expected[m]) for m in metrics for v in VARIANTS)
    return {'environment': env, 'values': values, 'blocks': blocks, 'complete': complete, 'expected': expected}


def report(root, arch, aggregate):
    directories = sorted(root.glob(f'ipc-minified-results-{arch}-*')) if aggregate else [root]
    runs = [load(p, arch) for p in directories]
    complete = bool(runs) and all(r['complete'] for r in runs) and (len(runs) == 3 if aggregate else True)
    if len({r['environment']['buildRun'] for r in runs}) != 1:
        raise RuntimeError('Mixed build artifact runs')
    metrics = list(runs[0]['values']) if runs else []
    summary = {'complete': complete, 'architecture': arch, 'buildType': 'bundled minified package', 'variants': COMMITS, 'runners': [{'environment': r['environment'], 'complete': r['complete']} for r in runs], 'metrics': {}}
    rows = []
    for m in metrics:
        comparisons = {f'{new}_vs_{old}': helper.compare(runs, m, old, new) for old, new in [('before', 'after'), ('buffer', 'after'), ('buffer', 'before')]}
        summary['metrics'][m] = {'variants': {v: helper.distribution([x for r in runs for x in r['values'][m][v]]) for v in VARIANTS}, 'comparisons': comparisons}
        for r in runs:
            for v in VARIANTS:
                rows.extend((r['environment']['replica'], m, v, i, x) for i, x in enumerate(r['values'][m][v]))
    text = [f'# Electron IPC: minified Linux {arch}', '', f'Complete: **{complete}**. Hosts: {len(runs)}. Positive changes mean more work or longer duration.', '', '| Metric | Samples/version | Fixed vs pre-fix (95% CI) | Fixed vs buffer (95% CI) | Pre-fix vs buffer (95% CI) |', '| --- | ---: | ---: | ---: | ---: |']
    for m, data in summary['metrics'].items():
        entries = []
        for key in ['after_vs_before', 'after_vs_buffer', 'before_vs_buffer']:
            c = data['comparisons'][key]
            entries.append(f"{c['percentChangeOfMeans']:+.3f}% [{c['meanChange95CI'][0]:+.3f}%, {c['meanChange95CI'][1]:+.3f}%]" if c else 'unavailable')
        counts = '/'.join(str(data['variants'][v]['count']) for v in VARIANTS)
        text.append(f'| {m} | {counts} | ' + ' | '.join(entries) + ' |')
    text += ['', 'Variants: buffer / direct IPC before marshalling fix / direct IPC with marshalling fix.', '', 'All three pinned October revisions run sequentially on each host. Standard native bundled minified packages, with the same extension-only Copilot SDK packaging repair on every variant; Electron, built-ins and SQLite verified. Effects average ratios within hosts. Confidence intervals resample hosts and paired blocks; only three hosts limit the evidence for host variation.', '', 'x64 startup uses the original internal readiness recorder, direct packaged launches, no debugger, three excluded warmups per host/version and one second quiet interval. Smoke uses the original issue selection, one excluded warmup and seven runs per host/version. ARM64 CPU uses the pinned editor-open scenario, fifteen launches per host/version and real perf PMU counters. Architectures are separate experiments. Historical August revisions and hardware remain different.', '']
    for m, data in summary['metrics'].items():
        for key, c in data['comparisons'].items():
            if c:
                text.append(f"- {m}, {key}: within-host changes " + ', '.join(f'{x:+.3f}%' for x in c['perRunnerMeanChanges']))
    root.mkdir(parents=True, exist_ok=True)
    (root / 'summary.json').write_text(json.dumps(summary, indent=2))
    (root / 'report.md').write_text('\n'.join(text) + '\n')
    with (root / 'samples.csv').open('w', newline='') as stream:
        writer = csv.writer(stream); writer.writerow(['host', 'metric', 'variant', 'sample', 'value']); writer.writerows(rows)
    print('\n'.join(text), flush=True)
    if not complete:
        raise RuntimeError('Incomplete benchmark')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    parser.add_argument('arch', choices=['x64', 'arm64'])
    parser.add_argument('--aggregate', action='store_true')
    args = parser.parse_args()
    report(args.root, args.arch, args.aggregate)
