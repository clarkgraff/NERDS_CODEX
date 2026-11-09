"""Read-only PBF display conversion. Assembles OSM areas with inner rings using libosmium."""
import argparse,json,pathlib,osmium,hashlib
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');p.add_argument('--bbox',required=True);a=p.parse_args();west,south,east,north=map(float,a.bbox.split(','));features=[];factory=osmium.geom.GeoJSONFactory();rejected=0
keys=('highway','building','waterway','natural','landuse','boundary','leisure','man_made')
def intersects(coords):
 return coords and min(c[0] for c in coords)<=east and max(c[0] for c in coords)>=west and min(c[1] for c in coords)<=north and max(c[1] for c in coords)>=south
def add(id,tags,geometry):features.append({'type':'Feature','id':id,'properties':tags,'geometry':geometry})
class Display(osmium.SimpleHandler):
 def way(self,w):
  global rejected
  tags=dict(w.tags)
  if not any(k in tags for k in keys):return
  try:coords=[[n.lon,n.lat] for n in w.nodes]
  except osmium.InvalidLocationError:rejected+=1;return
  if len(coords)<2 or not intersects(coords):return
  if coords[0]==coords[-1] and (tags.get('building') or tags.get('landuse') or tags.get('natural')=='water'):return
  add('way/'+str(w.id),tags,{'type':'LineString','coordinates':coords})
 def area(self,area):
  global rejected
  tags=dict(area.tags)
  if not any(k in tags for k in keys):return
  try:
   geometry=json.loads(factory.create_multipolygon(area));coords=[p for polygon in geometry['coordinates'] for ring in polygon for p in ring]
   if intersects(coords):add(('way/' if area.from_way() else 'relation/')+str(area.orig_id()),tags,geometry)
  except (RuntimeError,ValueError):rejected+=1
 def node(self,n):
  if n.tags.get('name') and n.location.valid() and west<=n.lon<=east and south<=n.lat<=north:add('node/'+str(n.id),dict(n.tags),{'type':'Point','coordinates':[n.lon,n.lat]})
Display().apply_file(a.source,locations=True,idx='flex_mem')
source=pathlib.Path(a.source);out=pathlib.Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
metadata={'source':str(source.resolve()),'sourceBytes':source.stat().st_size,'bounds':[west,south,east,north],'attribution':'OpenStreetMap contributors, ODbL','routingEvidence':False,'rejectedGeometries':rejected,'limitations':'Intersecting complete geometry retained; country extract may omit cross-border relations. Source topology is not navigability evidence.'}
out.write_text(json.dumps({'type':'FeatureCollection',**metadata,'features':features},separators=(',',':')),encoding='utf8');print(out.name,len(features),'features',sum(f['id'].startswith('relation/') for f in features),'relations',flush=True)
