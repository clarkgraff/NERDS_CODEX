"""Acquire GeoNames with validated HTTP range resumption; preserve completed files."""
import hashlib, json, pathlib, time, urllib.request, zipfile

ROOT = pathlib.Path('work/discovery')
BASE = 'https://download.geonames.org/export/dump/'

def acquire(url, target, attempts=4):
    target = pathlib.Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        print('Preserved', target.name, target.stat().st_size, flush=True)
        return
    partial = target.with_name(target.name + '.partial')
    metadata = target.with_name(target.name + '.transfer.json')
    for attempt in range(attempts):
        try:
            prior = json.loads(metadata.read_text(encoding='utf-8')) if metadata.exists() else {}
            offset = partial.stat().st_size if partial.exists() else 0
            # A daily dump can change between attempts. Never join different versions.
            validator = prior.get('etag') or prior.get('lastModified')
            if offset and (not validator or prior.get('url') != url):
                preserved = partial.with_name(partial.name + '.unverified.' + str(time.time_ns()))
                partial.rename(preserved)
                offset = 0
            headers = {'User-Agent': 'NERDS/0.3.1 geographic data acquisition'}
            if offset:
                headers.update({'Range': 'bytes=' + str(offset) + '-', 'If-Range': validator})
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=45) as response:
                status = response.status
                if offset and status != 206:
                    partial.rename(partial.with_name(partial.name + '.superseded.' + str(time.time_ns())))
                    offset = 0
                if status == 206 and not response.headers.get('Content-Range', '').startswith('bytes ' + str(offset) + '-'):
                    raise ValueError('Unexpected range response; partial retained')
                meta = {'url': url, 'etag': response.headers.get('ETag'), 'lastModified': response.headers.get('Last-Modified')}
                metadata.write_bytes(json.dumps(meta, indent=2).encode('utf-8'))
                expected = response.headers.get('Content-Length')
                received = 0
                last = time.monotonic()
                with partial.open('ab' if offset else 'wb') as output:
                    while True:
                        chunk = response.read(256 * 1024)
                        if not chunk: break
                        output.write(chunk)
                        received += len(chunk)
                        if time.monotonic() - last > 15:
                            print(target.name, offset + received, 'bytes', flush=True)
                            last = time.monotonic()
                if expected is not None and received != int(expected):
                    raise IOError('Incomplete response; partial retained')
            if target.suffix == '.zip':
                with zipfile.ZipFile(partial) as archive:
                    bad = archive.testzip()
                    if bad: raise ValueError('ZIP integrity failure: ' + bad)
            with partial.open('rb') as stream:
                meta['sha256'] = hashlib.file_digest(stream, 'sha256').hexdigest()
            meta['bytes'] = partial.stat().st_size
            metadata.write_bytes(json.dumps(meta, indent=2).encode('utf-8'))
            partial.rename(target)
            print('Downloaded', target.name, meta['bytes'], flush=True)
            return
        except Exception as error:
            print('Attempt', attempt + 1, target.name, str(error), flush=True)
    raise RuntimeError('Acquisition incomplete; retained partial and transfer metadata: ' + str(target))

if __name__ == '__main__':
    for name in ['readme.txt', 'countryInfo.txt', 'admin1CodesASCII.txt', 'featureCodes_en.txt', 'allCountries.zip']:
        acquire(BASE + name, ROOT / name)
