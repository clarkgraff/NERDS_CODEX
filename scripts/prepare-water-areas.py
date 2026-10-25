"""Reject ambiguous/invalid rings; rasterize only entire source-covered cells.
Development dependency: Shapely 2.1.2. Runtime uses the generated additive masks.
"""
import sys,pathlib,json,gzip,hashlib,math
sys.path.insert(0,str(pathlib.Path('work/topology/python-deps').resolve()))
import shapely
import numpy as np
from shapely.geometry import Polygon,box,mapping
REGIONS={'gironde-control':(-1.4,45.25,-.6,45.8,.002),'breves':(-50.8,-1.95,-50.1,-1.35,.001),'alter':(-55.15,-2.75,-54.5,-2.1,.002),'ontario':(-80,43,-75.5,44.7,.005),'don':(38.8,46.8,40,47.4,.002),'ushuaia':(-68.5,-54.95,-68,-54.65,.002),'magellan':(-71.2,-53.4,-70.6,-52.9,.002)}
def rings(parts):
 parts=[list(p) for p in parts];out=[]
 if any(len(p)<2 for p in parts):raise ValueError('Missing or degenerate ring member')
 while parts:
  ring=parts.pop()
  while ring[-1]!=ring[0]:
   matches=[(i,p[0]==ring[-1]) for i,p in enumerate(parts) if p[0]==ring[-1] or p[-1]==ring[-1]]
   if len(matches)!=1:raise ValueError('Open or ambiguous ring; no repair performed')
   i,forward=matches[0];p=parts.pop(i);ring.extend((p if forward else p[::-1])[1:])
  if len(ring)<4:raise ValueError('Degenerate ring')
  out.append(ring)
 return out

def feature(e):
 if e['type']=='way':outer=rings([[(p['lon'],p['lat']) for p in e['geometry']]]);inner=[]
 else:
  parts={'outer':[],'inner':[]}
  for m in e['members']:
   if m['type']!='way' or m.get('role') not in parts or not m.get('geometry'):raise ValueError('Unsupported or missing relation member')
   parts[m['role']].append([(p['lon'],p['lat']) for p in m['geometry']])
  outer=rings(parts['outer']);inner=rings(parts['inner'])
 if not outer:raise ValueError('Missing outer ring')
 containers=[Polygon(r) for r in outer];holes=[[] for _ in outer]
 for ring in inner:
  h=Polygon(ring);parents=[i for i,p in enumerate(containers) if p.covers(h)]
  if len(parents)!=1:raise ValueError('Uncontained or ambiguous hole')
  holes[parents[0]].append(ring)
 if any(not Polygon(r).is_valid for r in outer+inner):raise ValueError('Self-intersecting source ring; no geometry repair performed')
 # Exact set subtraction preserves every exclusion even if source holes touch
 # or overlap. No vertex is moved, snapped, buffered outwards or invented.
 polys=[Polygon(r).difference(shapely.union_all([Polygon(h) for h in hs])) for r,hs in zip(outer,holes)]
 if any(not p.is_valid or p.is_empty for p in polys):raise ValueError('Invalid water domain; no geometry repair performed')
 return polys,[Polygon(r) for r in inner]

def main(regions=None,input_root='work/topology',output_root='assets/water-areas'):
 output=pathlib.Path(output_root);output.mkdir(parents=True,exist_ok=True)
 manifest={'schemaVersion':1,'source':'https://www.openstreetmap.org/copyright','license':'ODbL 1.0; OpenStreetMap contributors','acquisition':'https://overpass-api.de/api/interpreter','method':'Exact ring assembly; invalid/ambiguous features rejected; entire cell plus 0.000001 degree guard covered by valid water union; all valid source holes unioned and subtracted without coordinate repair','preparer':'Shapely '+shapely.__version__,'regions':[],'limitations':['Geographic water evidence only; not clearance, permanence or vessel suitability','Conservative cells can disconnect narrow passages','No closure of open coastlines and no inferred ocean water','Polygon overlap cannot establish vessel navigability']}
 for name,(west,south,east,north,step) in (regions or REGIONS).items():
  raw=pathlib.Path(input_root)/(name+'-areas.json')
  if not raw.exists():continue
  data=raw.read_bytes();doc=json.loads(data)
  if doc.get('remark'):raise ValueError('Incomplete acquisition')
  members={m['ref'] for e in doc['elements'] if e['type']=='relation' for m in e.get('members',[]) if m['type']=='way'}
  accepted=[];rejected=[];polys=[];holes=[]
  for e in doc['elements']:
   if e['type'] not in ['way','relation'] or e.get('tags',{}).get('natural')!='water' or e['type']=='way' and e['id'] in members:continue
   identity=e['type']+'/'+str(e['id'])
   try:
    p,h=feature(e);polys.extend(p);holes.extend(h);accepted.append({'id':identity,'tags':e.get('tags',{}),'url':'https://www.openstreetmap.org/'+identity})
   except (ValueError,KeyError,TypeError) as error:rejected.append({'id':identity,'reason':str(error)})
  coverage=box(west,south,east,north);area=shapely.union_all(polys).intersection(coverage)
  if holes:area=area.difference(shapely.union_all(holes))
  shapely.prepare(area);width=math.ceil((east-west)/step);height=math.ceil((north-south)/step)
  mask=np.ones((height,width),dtype=np.uint8);excluded=np.zeros((height,width),dtype=np.uint8);hole_area=shapely.union_all(holes).intersection(coverage);shapely.prepare(hole_area);epsilon=.000001
  for y in range(height):
   xs=west+np.arange(width)*step;ys=south+y*step
   cells=shapely.box(xs-epsilon,ys-epsilon,xs+step+epsilon,ys+step+epsilon)
   mask[y]=np.logical_not(shapely.covers(area,cells));excluded[y]=shapely.intersects(hole_area,cells)
  exclusion=excluded.tobytes();(output/(name+'-exclusions.bin.gz')).write_bytes(gzip.compress(exclusion,mtime=0))
  binary=mask.tobytes();digest=hashlib.sha256(binary).hexdigest();(output/(name+'.bin.gz')).write_bytes(gzip.compress(binary,mtime=0))
  geometry=json.dumps(mapping(area),separators=(',',':')).encode();(output/(name+'.geojson.gz')).write_bytes(gzip.compress(geometry,mtime=0))
  record={'id':name,'extent':{'west':west,'south':south,'east':west+width*step,'north':south+height*step},'resolutionDegrees':step,'dimensions':[width,height],'waterCells':int(np.sum(mask==0)),'maskSHA256':digest,'exclusionSHA256':hashlib.sha256(exclusion).hexdigest(),'geometrySHA256':hashlib.sha256(geometry).hexdigest(),'acquisitionSHA256':hashlib.sha256(data).hexdigest(),'osmTimestamp':doc.get('osm3s',{}).get('timestamp_osm_base'),'query':raw.with_name(name+'-query.txt').read_text(),'accepted':accepted,'rejected':rejected}
  manifest['regions'].append(record);print(name,len(accepted),len(rejected),record['waterCells'],flush=True)
 manifest['sha256']=hashlib.sha256(json.dumps(manifest['regions'],sort_keys=True).encode()).hexdigest()
 (output/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--regions');parser.add_argument('--input-root',default='work/topology');parser.add_argument('--output-root',default='assets/water-areas');args=parser.parse_args()
 selected=json.loads(pathlib.Path(args.regions).read_text(encoding='utf-8')) if args.regions else None
 if selected:
  for name,v in selected.items():
   if not name.replace('-','').replace('.','').isalnum() or len(v)!=5:raise ValueError('Invalid region definition')
   west,south,east,north,step=v
   if not (-180<=west<east<=180 and -90<=south<north<=90 and .0001<=step<=.1) or (east-west)*(north-south)/step**2>2000000:raise ValueError('Region cell budget exceeded')
 main(selected,args.input_root,args.output_root)
