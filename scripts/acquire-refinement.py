"""Acquire additive OSM refinement evidence; never replace existing datasets."""
import urllib.request, urllib.parse, pathlib, json, time
root=pathlib.Path('work/refinement');root.mkdir(parents=True,exist_ok=True)
regions={'bordeaux':(44.7,-1.5,45.8,-.4),'amazon-estuary':(-3,-52,1,-48),'alter-do-chao':(-3,-56,-1.8,-54),'southern':(-56,-76,-51,-66),'great-lakes-flowlines':(43,-80,47,-70),'rostov':(46.8,38.5,47.5,40)}
for name,box in regions.items():
 target=root/(name+'.json')
 if target.exists():print('Preserved',name,flush=True);continue
 kind='flowline' if name=='great-lakes-flowlines' else '(river|canal|fairway|flowline)'
 query='[out:json][timeout:40];way[waterway~"^'+kind+'$"]('+','.join(map(str,box))+');out geom;'
 (root/(name+'-query.txt')).write_text(query)
 try:
  req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':query}).encode(),headers={'User-Agent':'NERDS-stage2-refinement'})
  data=urllib.request.urlopen(req,timeout=50).read();doc=json.loads(data)
  if doc.get('remark'):raise RuntimeError(doc['remark'])
  target.write_bytes(data);print(name,len(doc['elements']),len(data),flush=True)
 except Exception as error:print(name,'UNRESOLVED',str(error),flush=True)
 time.sleep(10)
