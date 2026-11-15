#!/usr/bin/env python3
"""Build a Git-ignore-aware, credential-checked source submission without Git metadata."""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / 'submission'
ARCHIVE = DESTINATION / 'Markloom-complete-source.zip'
EXCLUDED = {'.git', 'node_modules', '.venv', '__pycache__', '.pytest_cache', '.ruff_cache',
            '.cache', '.pnpm-store', 'dist', 'test-results', 'playwright-report',
            'submission', 'tmp', 'output', 'design-reference', '.temp'}
PATTERNS = [re.compile(rb'sb_secret_[A-Za-z0-9_-]{10,}'),
            re.compile(rb'\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}'),
            re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
            re.compile(rb'\bgh[pousr]_[A-Za-z0-9]{30,}'),
            re.compile(rb'\bgithub_pat_[A-Za-z0-9_]{30,}')]


def selected_files() -> list[Path]:
    result = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
                            cwd=ROOT, check=True, capture_output=True)
    files = []
    for name in sorted(set(result.stdout.decode().split('\0')) - {''}):
        path = ROOT / name
        relative = path.relative_to(ROOT)
        if set(relative.parts) & EXCLUDED:
            continue
        if path.is_symlink():
            raise SystemExit(f'Excluded symlink must be reviewed before packaging: {name}')
        if not path.is_file():
            continue
        if path.name.startswith('.env') and path.name != '.env.example':
            raise SystemExit(f'Credential configuration is not submission source: {name}')
        if path.name.endswith(('.log', '.tsbuildinfo', '.pyc')):
            continue
        data = path.read_bytes()
        if any(pattern.search(data) for pattern in PATTERNS):
            raise SystemExit(f'Potential credential found; archive not created: {name}')
        for token in re.findall(rb'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', data):
            try:
                payload = token.split(b'.')[1]
                claims = json.loads(base64.urlsafe_b64decode(payload + b'=' * (-len(payload) % 4)))
            except (ValueError, TypeError):
                continue
            if claims.get('role') == 'service_role' or claims.get('session_id') or claims.get('email'):
                raise SystemExit(f'Potential private session JWT found; archive not created: {name}')
        files.append(path)
    required = ['frontend/package.json', 'frontend/pnpm-lock.yaml', 'backend/pyproject.toml',
                'backend/uv.lock', '.github/workflows/verify.yml', 'GITHUB_SUBMISSION.md',
                'frontend/.env.example', 'backend/.env.example', '.env.example']
    names = {p.relative_to(ROOT).as_posix() for p in files}
    for name in required:
        if name not in names:
            raise SystemExit(f'Missing submission file: {name}')
    if not any(name.startswith('supabase/migrations/') for name in names):
        raise SystemExit('Supabase migrations missing')
    return files


def main() -> None:
    files = selected_files()
    DESTINATION.mkdir(exist_ok=True)
    with zipfile.ZipFile(ARCHIVE, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            archive.write(path, 'Markloom/' + path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(ARCHIVE) as archive:
        if archive.testzip():
            raise SystemExit('Archive integrity check failed')
        if len(archive.infolist()) != len(files):
            raise SystemExit('Archive file count mismatch')
    digest = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    manifest = {'archive': ARCHIVE.name, 'sha256': digest, 'files': len(files),
                'size_bytes': ARCHIVE.stat().st_size,
                'entries': [{'path': p.relative_to(ROOT).as_posix(),
                             'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
    (DESTINATION / 'submission-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (DESTINATION / 'Markloom-complete-source.zip.sha256').write_text(f'{digest}  {ARCHIVE.name}\n')
    print(f'PASS: {len(files)} files scanned and archived; ZIP integrity verified')
    print(f'{ARCHIVE} ({ARCHIVE.stat().st_size:,} bytes)')
    print(f'SHA-256: {digest}')


if __name__ == '__main__':
    main()
