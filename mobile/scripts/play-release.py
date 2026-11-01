#!/usr/bin/env python3
"""Upload an .aab to Google Play and release it on one or more tracks.

A fallback for `eas submit -p android`, which has repeatedly failed for this project
with "Failed to create worker instance" (an EAS-side error, visible only in the
submission log). This talks to the Play Developer API directly.

    python3 scripts/play-release.py dist/app.aab internal alpha --notes "Was ist neu…"

Needs mobile/play-service-account.json (git-ignored) with the key of
play-publisher@stg-schuelerzeitung.iam.gserviceaccount.com, and openssl on PATH.
Download the bundle EAS built with:

    npx eas-cli build:list --limit 4 --json   # take artifacts.applicationArchiveUrl
"""
import argparse, base64, json, os, subprocess, sys, tempfile, time
import urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(HERE, '..', 'play-service-account.json')
APP_JSON = os.path.join(HERE, '..', 'app.json')
API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
UPLOAD_API = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications'


def access_token(key: dict) -> str:
    b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b'=')
    now = int(time.time())
    signing_input = b64(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode()) + b'.' + b64(json.dumps({
        'iss': key['client_email'],
        'scope': 'https://www.googleapis.com/auth/androidpublisher',
        'aud': 'https://oauth2.googleapis.com/token',
        'iat': now, 'exp': now + 3600,
    }).encode())
    fd, pem = tempfile.mkstemp(suffix='.pem')
    os.close(fd)
    os.chmod(pem, 0o600)
    open(pem, 'w').write(key['private_key'])
    try:
        sig = subprocess.run(['openssl', 'dgst', '-sha256', '-sign', pem],
                             input=signing_input, capture_output=True, check=True).stdout
    finally:
        os.remove(pem)
    body = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': (signing_input + b'.' + b64(sig)).decode(),
    }).encode()
    return call('https://oauth2.googleapis.com/token', body, method='POST')['access_token']


def call(url, data=None, token=None, method='GET', ctype=None, quiet=False, timeout=900):
    req = urllib.request.Request(url, data=data, method=method)
    if token:
        req.add_header('Authorization', 'Bearer ' + token)
    if ctype:
        req.add_header('Content-Type', ctype)
    elif data and data[:1] == b'{':
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        e.detail = e.read().decode('utf-8', 'ignore')
        if not quiet:
            print(f'!! HTTP {e.code} {method} {url.split("/applications/")[-1][:70]}\n{e.detail[:1000]}')
        raise


def commit(base, edit_id, token):
    """Play requires changesNotSentForReview exactly while it will not auto-submit the
    changes, and rejects the flag otherwise. Which one applies depends on the app's
    review state, so try the plain commit first and fall back on Play's own complaint."""
    for suffix in ('', '?changesNotSentForReview=true'):
        try:
            call(f'{base}/edits/{edit_id}:commit{suffix}', b'', token, 'POST', quiet=True)
            print('   committed.' + (' Send the changes for review in the Play Console.' if suffix else ' Play submits them for review itself.'))
            return
        except urllib.error.HTTPError as e:
            if suffix or 'changesNotSentForReview' not in getattr(e, 'detail', ''):
                print(getattr(e, 'detail', '')[:600])
                raise


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('aab')
    ap.add_argument('tracks', nargs='+', help='production, beta, alpha (closed test) or internal')
    ap.add_argument('--notes', default='', help='release notes (de-DE)')
    args = ap.parse_args()

    key = json.load(open(KEY_PATH))
    package = json.load(open(APP_JSON))['expo']['android']['package']
    base, upload_base = f'{API}/{package}', f'{UPLOAD_API}/{package}'
    token = access_token(key)
    print(f'{package} as {key["client_email"]}')

    def release(version_code):
        r = {'versionCodes': [version_code], 'status': 'completed'}
        if args.notes:
            r['releaseNotes'] = [{'language': 'de-DE', 'text': args.notes}]
        return r

    edit = call(f'{base}/edits', b'{}', token, 'POST')
    try:
        blob = open(args.aab, 'rb').read()
        print(f'uploading {len(blob) / 1e6:.0f} MB …')
        # A bundle this size can stall on a slow link; one retry saves re-running the whole thing.
        for attempt in (1, 2, 3):
            try:
                version_code = str(call(f'{upload_base}/edits/{edit["id"]}/bundles?uploadType=media',
                                        blob, token, 'POST', ctype='application/octet-stream',
                                        timeout=3600)['versionCode'])
                break
            except (TimeoutError, OSError) as e:
                if attempt == 3:
                    raise
                print(f'   upload attempt {attempt} failed ({type(e).__name__}), retrying …')
                time.sleep(5)
        print(f'   versionCode {version_code}')
        call(f'{base}/edits/{edit["id"]}/tracks/{args.tracks[0]}',
             json.dumps({'track': args.tracks[0], 'releases': [release(version_code)]}).encode(), token, 'PUT')
        commit(base, edit['id'], token)
        print(f'   {args.tracks[0]} -> {version_code}')
    except Exception:
        try:
            call(f'{base}/edits/{edit["id"]}', None, token, 'DELETE', quiet=True)
        except Exception:
            pass
        raise

    # One edit per track: an uncommitted edit blocks the next one.
    for track in args.tracks[1:]:
        nxt = call(f'{base}/edits', b'{}', token, 'POST')
        try:
            call(f'{base}/edits/{nxt["id"]}/tracks/{track}',
                 json.dumps({'track': track, 'releases': [release(version_code)]}).encode(), token, 'PUT')
            commit(base, nxt['id'], token)
            print(f'   {track} -> {version_code}')
        except Exception:
            try:
                call(f'{base}/edits/{nxt["id"]}', None, token, 'DELETE', quiet=True)
            except Exception:
                pass
            raise
    return 0


if __name__ == '__main__':
    sys.exit(main())
