"""Extract complete local OSM coast/flowline ways into a provenance-bearing preparation input."""
import argparse,json,hashlib,pathlib,osmium
p=argparse.ArgumentParser();p.add_argument('--source',action='append',required=True);p.add_argument('--bbox',nargs=4,type=float,required=True);p.add_argument('--output',required=True);a=p.parse_args()
west,south,east,north=a.bbox;elements={};sources=[]
class Hydro(osmium.SimpleHandler):
 def way(self,w):
  tags=dict(w.tags)
  if tags.get('natural')!='coastline' and tags.get('waterway') not in ('river','canal','fairway','flowline'):return
  points=[{'lat':n.lat,'lon':n.lon} for n in w.nodes]
  if not points:return
  if max(q['lon'] for q in points)<west or min(q['lon'] for q in points)>east or max(q['lat'] for q in points)<south or min(q['lat'] for q in points)>north:return
  entry={'type':'way','id':w.id,'version':w.version,'tags':tags,'geometry':points}
  old=elements.get(w.id)
  if old and old['version']==w.version and old!=entry:raise ValueError('Conflicting same-version source way '+str(w.id))
  if not old or old['version']<w.version:elements[w.id]=entry
for source in a.source:
 path=pathlib.Path(source);h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(8*1024*1024),b''):h.update(b)
 sources.append({'path':str(path.resolve()),'bytes':path.stat().st_size,'sha256':h.hexdigest()})
 Hydro().apply_file(str(path),locations=True,idx='flex_mem');print(path.name,len(elements),flush=True)
out=pathlib.Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'version':0.6,'generator':'NERDS local hydrography extractor v1','license':'OpenStreetMap ODbL 1.0','attribution':'© OpenStreetMap contributors','sources':sources,'bounds':a.bbox,'limitations':['Coastline and flowlines only; water-area relations not included','Geographic evidence, not depth or safe-passage evidence'],'elements':list(elements.values())}),encoding='utf8')
