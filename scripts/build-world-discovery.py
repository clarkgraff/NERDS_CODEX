"""Build a separate all-feature offline index; never replace the legacy seed database.

Usage: python scripts/build-world-discovery.py [archive.zip ...]
Only the allCountries archive represents worldwide coverage. Country archives are
supported for diagnostics and explicitly recorded as partial coverage.
"""
import datetime, hashlib, io, json, pathlib, sqlite3, sys, zipfile

root = pathlib.Path('work/discovery')
archives = [pathlib.Path(p) for p in sys.argv[1:]] or [root / 'allCountries.zip']
out = pathlib.Path('assets/discovery')
out.mkdir(parents=True, exist_ok=True)
target = out / 'world.sqlite'
building = out / 'world.building.sqlite'
if building.exists():
    raise SystemExit('An unfinished index exists; preserve/inspect it before retrying: ' + str(building))
countries, admins, features = {}, {}, {}
for line in (root / 'countryInfo.txt').read_text(encoding='utf-8').splitlines():
    if line and not line.startswith('#'):
        f = line.split('\t'); countries[f[0]] = f[4]
for line in (root / 'admin1CodesASCII.txt').read_text(encoding='utf-8').splitlines():
    f = line.split('\t'); admins[f[0]] = f[1]
for line in (root / 'featureCodes_en.txt').read_text(encoding='utf-8').splitlines():
    f = line.split('\t'); features[f[0]] = f[1]
sources = []
for archive in archives:
    with zipfile.ZipFile(archive) as z:
        bad = z.testzip()
        if bad: raise ValueError('Corrupt archive member: ' + bad)
        if archive.stem + '.txt' not in z.namelist(): raise ValueError('Missing GeoNames data member')
    digest = hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
    sources.append({'file': archive.name, 'sha256': digest,
                    'url': 'https://download.geonames.org/export/dump/' + archive.name})
db = sqlite3.connect(building)
db.executescript('''PRAGMA journal_mode=DELETE; PRAGMA synchronous=NORMAL;
CREATE TABLE places(id INTEGER PRIMARY KEY,name TEXT,aliases TEXT,lat REAL,lon REAL,
 country TEXT,region TEXT,kind TEXT,featureClass TEXT,featureCode TEXT,zone TEXT,modified TEXT);
CREATE VIRTUAL TABLE names USING fts5(name,aliases,country,region,content='places',content_rowid='id',tokenize='unicode61 remove_diacritics 2');
CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
''')
count = 0
for archive in archives:
    with zipfile.ZipFile(archive) as z:
        batch = []
        with z.open(archive.stem + '.txt') as stream:
            for line in io.TextIOWrapper(stream, encoding='utf-8'):
                f = line.rstrip('\n').split('\t')
                if len(f) < 19: raise ValueError('Malformed GeoNames row')
                lat, lon = float(f[4]), float(f[5])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180): raise ValueError('Invalid coordinates')
                code = f[6] + '.' + f[7]
                aliases = ','.join(dict.fromkeys([f[2]] + f[3].split(',')))
                batch.append((int(f[0]), f[1], aliases, lat, lon, countries.get(f[8], f[8]),
                              admins.get(f[8]+'.'+f[10], f[10]), features.get(code, code),
                              f[6], f[7], f[17] or 'UTC', f[18]))
                if len(batch) == 20000:
                    db.executemany('INSERT OR REPLACE INTO places VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', batch)
                    db.commit(); count += len(batch); batch = []
                    if count % 200000 == 0: print('Imported', count, flush=True)
        db.executemany('INSERT OR REPLACE INTO places VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', batch)
        db.commit(); count += len(batch)
print('Building full-text index', flush=True)
db.execute("INSERT INTO names(names) VALUES('rebuild')")
db.execute('CREATE INDEX places_coordinates ON places(lat,lon)')
manifest = {'schema': 1, 'provider': 'GeoNames', 'license': 'CC BY 4.0',
            'attribution': 'GeoNames contributors', 'source': 'https://www.geonames.org/export/',
            'coverage': 'worldwide-all-features' if any(p.name == 'allCountries.zip' for p in archives) else 'partial-country-import',
            'populationFilter': None, 'sources': sources,
            'builtAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'count': db.execute('SELECT count(*) FROM places').fetchone()[0]}
db.execute('INSERT INTO metadata VALUES(?,?)', ('manifest', json.dumps(manifest)))
db.commit()
assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
db.close()
if target.exists():
    backup = out / ('world.previous.' + datetime.datetime.now().strftime('%Y%m%d%H%M%S') + '.sqlite')
    target.replace(backup)
building.replace(target)
manifest['databaseSha256'] = hashlib.file_digest(target.open('rb'), 'sha256').hexdigest()
(out / 'manifest.json').write_bytes((json.dumps(manifest, indent=2)+'\n').encode('utf-8'))
print(json.dumps(manifest, indent=2), flush=True)
