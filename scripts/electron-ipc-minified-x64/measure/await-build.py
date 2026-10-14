import json
import os
from pathlib import Path
import subprocess
import time

repo = os.environ['GITHUB_REPOSITORY']
run = os.environ['IPC_BUILD_RUN']
arch = os.environ['IPC_ARCH']
expected_sha = '827f9416479807f0d92e9ffde85a09c7ca145c19'


def api(path):
    return json.loads(subprocess.check_output(['gh', 'api', f'repos/{repo}/{path}'], text=True))


while True:
    source = api(f'actions/runs/{run}')
    if source['head_sha'] != expected_sha:
        raise RuntimeError('Build workflow revision mismatch')
    jobs = [j for j in api(f'actions/runs/{run}/jobs?per_page=100')['jobs'] if f', {arch}, ' in j['name']]
    if len(jobs) != 3:
        raise RuntimeError('Unexpected build matrix')
    if any(j['status'] == 'completed' and j['conclusion'] != 'success' for j in jobs):
        raise RuntimeError(f'Failed {arch} build job')
    if all(j['status'] == 'completed' and j['conclusion'] == 'success' for j in jobs):
        artifacts = api(f'actions/runs/{run}/artifacts?per_page=100')['artifacts']
        selected = [a for a in artifacts if a['name'].startswith(f'ipc-minified-{arch}-') and not a['expired']]
        if {a['name'] for a in selected} != {f'ipc-minified-{arch}-{v}' for v in ['buffer','before','after']}:
            raise RuntimeError('Build artifact inventory mismatch')
        Path('build-provenance.json').write_text(json.dumps({'run': run, 'headSha': expected_sha, 'architecture': arch, 'jobs': jobs, 'artifacts': selected}, indent=2))
        print(f'Accepted three successful native {arch} minified build jobs', flush=True)
        break
    print(f'Waiting for all three {arch} package jobs', flush=True)
    time.sleep(30)
