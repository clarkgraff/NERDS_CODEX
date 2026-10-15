"""Reproducible worldwide place index from attributed GeoNames and Natural Earth inputs."""
import gzip,json,sqlite3,zipfile,pathlib,unicodedata,hashlib,datetime
root=pathlib.Path(__file__).resolve().parent.parent
data=root/'work/downloads';out=root/'assets/geonames.sqlite'
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s).lower() if not unicodedata.combining(c)).strip()
countries={};admins={}
for line in (data/'countryInfo.txt').read_text(encoding='utf8').splitlines():
 if line and not line.startswith('#'):
  f=line.split('\t');countries[f[0]]=f[4]
for line in (data/'admin1CodesASCII.txt').read_text(encoding='utf8').splitlines():
 f=line.split('\t');admins[f[0]]=f[1]
if out.exists():out.unlink()
db=sqlite3.connect(out);db.executescript('PRAGMA journal_mode=OFF; CREATE TABLE places(id TEXT PRIMARY KEY,name TEXT,country TEXT,region TEXT,lat REAL,lon REAL,zone TEXT,source TEXT,kind TEXT,aliases TEXT); CREATE VIRTUAL TABLE names USING fts5(terms,place_id UNINDEXED, tokenize="unicode61 remove_diacritics 2",prefix="2 3 4");')
count=0
with zipfile.ZipFile(data/'cities500.zip') as z:
 for raw in z.open('cities500.txt'):
  f=raw.decode('utf8').rstrip('\n').split('\t');identifier='geonames:'+f[0]
  db.execute('INSERT INTO places VALUES (?,?,?,?,?,?,?,?,?,?)',(identifier,f[1],countries.get(f[8],f[8]),admins.get(f[8]+'.'+f[10],f[10]),float(f[4]),float(f[5]),f[17],'https://www.geonames.org/'+f[0],f[7],f[3]))
  db.execute('INSERT INTO names VALUES (?,?)',(' '.join([f[1],f[2],f[3].replace(',',' ')]),identifier));count+=1
geo=json.loads((data/'places.geojson').read_text(encoding='utf8'))
for i,feature in enumerate(geo['features']):
 p=feature['properties'];name=p.get('name') or p.get('name_en');g=feature['geometry']
 if not name or g['type']!='Point':continue
 identifier='naturalearth:'+str(p.get('ne_id',i));lon,lat=g['coordinates'][:2]
 db.execute('INSERT OR IGNORE INTO places VALUES (?,?,?,?,?,?,?,?,?,?)',(identifier,name,'',p.get('region','') or '',lat,lon,'UTC','https://www.naturalearthdata.com/',p.get('featurecla','Named geographic place'),' '.join(str(v) for k,v in p.items() if k.startswith('name') and v)))
 db.execute('INSERT INTO names VALUES (?,?)',(name,identifier));count+=1
db.commit();db.execute("INSERT INTO names(names) VALUES ('optimize')");db.commit();db.execute('VACUUM');db.close()
with out.open('rb') as src,gzip.open(str(out)+'.gz','wb',compresslevel=9) as dst:
 import shutil;shutil.copyfileobj(src,dst)
manifest={'id':'world-places-v1','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':count,'coverage':'GeoNames cities500: populated places >500 residents and administrative centres worldwide; Natural Earth named geographic points. Smaller settlements and missing names can use optional online lookup.','sources':[{'url':'https://download.geonames.org/export/dump/cities500.zip','license':'CC BY 4.0','attribution':'GeoNames'},{'url':'https://www.naturalearthdata.com/','license':'Public domain','attribution':'Natural Earth'}],'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'inputSha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in data.iterdir() if p.is_file()}}
(root/'assets/gazetteer-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8');print(json.dumps({'places':count,'databaseBytes':out.stat().st_size,'compressedBytes':pathlib.Path(str(out)+'.gz').stat().st_size}))
