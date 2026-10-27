# Independent GEOS coverage audit of WGS84-sampled authoritative course segments.
import sys,pathlib,json,gzip
sys.path.insert(0,str(pathlib.Path('work/topology/python-deps').resolve()))
from shapely.geometry import shape,LineString
out=pathlib.Path('docs/stage2-0.3.1/topology-validation')
samples=json.loads((out/'area-audit-samples.json').read_text());areas={};failures=[]
for i,s in enumerate(samples):
 if s['area'] not in areas:areas[s['area']]=shape(json.loads(gzip.decompress((pathlib.Path('assets/water-areas')/(s['area']+'.geojson.gz')).read_bytes())))
 if not areas[s['area']].covers(LineString(s['coords'])):failures.append({'edge':i,'area':s['area']})
result={'method':'GEOS covers against retained source water polygons with holes; authoritative geodesics sampled at <=20 m; independent of production raster validator','checkedUniqueDirectedAreaEdges':len(samples),'failures':failures,'status':'PASS' if samples and not failures else 'FAIL','limitation':'Finite 20 m linear approximation; not vessel clearance or worldwide coverage'}
(out/'independent-geometry-audit.json').write_text(json.dumps(result,indent=2));print(result)
if failures or not samples:sys.exit(1)
