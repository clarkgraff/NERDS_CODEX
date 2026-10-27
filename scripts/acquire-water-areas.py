"""Bounded additive OSM water-area acquisition; preserve completed responses."""
import urllib.request,urllib.parse,json,pathlib,time,hashlib
root=pathlib.Path('work/topology');root.mkdir(parents=True,exist_ok=True)
regions={'gironde-control':(45.25,-1.4,45.8,-.6),'breves':(-1.95,-50.8,-1.35,-50.1),'alter':(-2.75,-55.15,-2.1,-54.5),'ontario':(43.2,-79.9,44.5,-76),'don':(46.8,38.8,47.4,40),'ushuaia':(-54.95,-68.5,-54.65,-68),'magellan':(-53.4,-71.2,-52.9,-70.6)}
log=json.loads((root/'acquisition.json').read_text()) if (root/'acquisition.json').exists() else []
for name,box in regions.items():
 target=root/(name+'-areas.json')
 q='[out:json][timeout:45];(way["natural"="water"]('+','.join(map(str,box))+');rel["type"="multipolygon"]["natural"="water"]('+','.join(map(str,box))+'););out geom;'
 query_file=root/(name+'-query.txt')
 if not query_file.exists():query_file.write_text(q)
 if target.exists():
  previous=json.loads(target.read_bytes())
  if previous.get('remark') or not isinstance(previous.get('elements'),list):raise RuntimeError('Existing acquisition invalid; preserved for investigation: '+str(target))
  print('PRESERVED',name,flush=True);continue
 for attempt in range(2):
  try:
   req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':q}).encode(),headers={'User-Agent':'NERDS-stage2-water-area-topology'})
   data=urllib.request.urlopen(req,timeout=55).read();doc=json.loads(data)
   if doc.get('remark'):raise RuntimeError(doc['remark'])
   temporary=target.with_suffix('.partial');temporary.write_bytes(data);temporary.replace(target);entry={'region':name,'attempt':attempt+1,'status':'ACQUIRED','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'elements':len(doc['elements'])};log.append(entry);(root/'acquisition.json').write_text(json.dumps(log,indent=2));print(entry,flush=True);break
  except Exception as error:
   entry={'region':name,'attempt':attempt+1,'status':'UNRESOLVED','error':str(error)};log.append(entry);(root/'acquisition.json').write_text(json.dumps(log,indent=2));print(entry,flush=True)
   if attempt==0:time.sleep(15)
 time.sleep(10)
(root/'acquisition.json').write_text(json.dumps(log,indent=2))
