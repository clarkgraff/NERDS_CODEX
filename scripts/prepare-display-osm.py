"""Read-only OSM PBF to bounded display GeoJSON; never routing evidence."""
import argparse,json,pathlib,osmium
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');p.add_argument('--bbox',required=True);a=p.parse_args();west,south,east,north=map(float,a.bbox.split(','));features=[]
class Display(osmium.SimpleHandler):
 def way(self,w):
  tags=dict(w.tags)
  if not any(k in tags for k in ('highway','building','waterway','natural','landuse','boundary','leisure','man_made')):return
  try: coords=[[n.lon,n.lat] for n in w.nodes]
  except osmium.InvalidLocationError:return
  if len(coords)<2 or not all(west<=x<=east and south<=y<=north for x,y in coords):return
  polygon=coords[0]==coords[-1] and len(coords)>=4 and (tags.get('building') or tags.get('landuse') or tags.get('natural')=='water')
  features.append({'type':'Feature','id':'way/'+str(w.id),'properties':tags,'geometry':{'type':'Polygon' if polygon else 'LineString','coordinates':[coords] if polygon else coords}})
 def node(self,n):
  if n.tags.get('name') and n.location.valid() and west<=n.lon<=east and south<=n.lat<=north:features.append({'type':'Feature','id':'node/'+str(n.id),'properties':dict(n.tags),'geometry':{'type':'Point','coordinates':[n.lon,n.lat]}})
Display().apply_file(a.source,locations=True,idx='flex_mem')
out=pathlib.Path(a.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'type':'FeatureCollection','source':str(pathlib.Path(a.source).resolve()),'attribution':'OpenStreetMap contributors, ODbL','routingEvidence':False,'limitations':'Bounded complete ways only; relation multipolygons not assembled; no elevation or navigability evidence.','features':features}),encoding='utf8');print(len(features),'features')
