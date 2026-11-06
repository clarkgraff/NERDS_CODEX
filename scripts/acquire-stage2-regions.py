import urllib.request,urllib.parse,pathlib,json,time
root=pathlib.Path('work/stage2');root.mkdir(parents=True,exist_ok=True)
regions={'lawrence-west':(43,-77,46,-72),'lawrence-east':(45,-74,48,-69),'breves-channels':(-2.2,-51,-1,-49.5),'southern-channels':(-56,-75,-52,-66)}
for name,box in regions.items():
 target=root/(name+'-osm.json')
 if target.exists():print('Preserved',name,flush=True);continue
 q='[out:json][timeout:40];way[waterway~"^(river|canal|fairway)$"]('+','.join(map(str,box))+');out geom;'
 try:
  req=urllib.request.Request('https://overpass-api.de/api/interpreter',data=urllib.parse.urlencode({'data':q}).encode(),headers={'User-Agent':'NERDS-stage2-geographic-data'})
  data=urllib.request.urlopen(req,timeout=50).read();doc=json.loads(data)
  if doc.get('remark'):raise RuntimeError(doc['remark'])
  target.write_bytes(data);(root/(name+'-query.txt')).write_text(q);print(name,len(doc['elements']),len(data),flush=True)
 except Exception as e:print(name,'FAILED',str(e),flush=True)
 time.sleep(2)
